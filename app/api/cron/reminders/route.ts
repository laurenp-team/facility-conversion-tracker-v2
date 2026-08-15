import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";
import type { DocumentCategory, DocumentStatus } from "@/lib/types";

// Vercel Cron hits this once daily (see vercel.json). It's also the "direct
// URL" for manually confirming the logic without waiting a full day. Per the
// 5B spec, this implements the financial/site-build timing rules exactly;
// per user request it now also emails a daily summary (every day, even if
// nothing was due) rather than log-only.

const FINANCIAL_WINDOW_DAYS = 21; // 3 weeks
const SITE_BUILD_SEND_WINDOW_DAYS = 28; // 4 weeks
const SITE_BUILD_REMINDER_WINDOW_DAYS = 14; // 2 weeks
const REMINDER_COOLDOWN_DAYS = 7;

const REMINDER_EMAIL_TO = "laurenp@twteams.com";
const REMINDER_EMAIL_FROM = "Facility Conversion Tracker <onboarding@resend.dev>";

interface DocumentWithConversion {
  id: string;
  conversion_id: string;
  name: string;
  category: DocumentCategory;
  status: DocumentStatus;
  date_sent: string | null;
  date_last_reminded: string | null;
  conversion:
    | { facility_name: string; go_live_date: string }
    | { facility_name: string; go_live_date: string }[]
    | null;
}

interface ActionEntry {
  facilityName: string;
  documentName: string;
  category: DocumentCategory;
  daysUntilGoLive: number;
}

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// date_last_reminded/date_sent are now full timestamps (see migration 0003);
// truncate to the UTC date for the day-based window/cooldown math, which is
// unaffected by the added time precision.
function toUTCDateOnlyFromTimestamp(ts: string): Date {
  const d = new Date(ts);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Whole days from `from` to `to` (positive if `to` is later).
function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

function getConversion(doc: DocumentWithConversion) {
  if (!doc.conversion) return null;
  return Array.isArray(doc.conversion) ? doc.conversion[0] ?? null : doc.conversion;
}

function formatEntry(entry: ActionEntry): string {
  const dueDesc =
    entry.daysUntilGoLive < 0
      ? `${Math.abs(entry.daysUntilGoLive)} day(s) past go-live`
      : `${entry.daysUntilGoLive} day(s) until go-live`;
  return `${entry.facilityName} — ${entry.documentName} (${entry.category}) — ${dueDesc}`;
}

function buildEmailBody(
  remindersSent: ActionEntry[],
  markedSent: ActionEntry[]
): string {
  if (remindersSent.length === 0 && markedSent.length === 0) {
    return "No documents needed reminders or auto-send actions today.";
  }

  const sections: string[] = [];

  if (remindersSent.length > 0) {
    sections.push(
      "Documents that still need to be sent/received (reminded today):\n" +
        remindersSent.map((e) => `  - ${formatEntry(e)}`).join("\n")
    );
  }

  if (markedSent.length > 0) {
    sections.push(
      "Site build documents auto-marked as sent today (4 weeks out):\n" +
        markedSent.map((e) => `  - ${formatEntry(e)}`).join("\n")
    );
  }

  return sections.join("\n\n");
}

export async function GET() {
  const today = todayUTC();
  const todayStr = toDateOnlyString(today);
  const nowIso = new Date().toISOString();

  const { data: documents, error } = await supabase
    .from("documents")
    .select("*, conversion:conversions(facility_name, go_live_date)")
    .not("status", "in", "(received,approved)")
    .returns<DocumentWithConversion[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const markedSent: ActionEntry[] = [];
  const remindersSent: ActionEntry[] = [];
  const skipped: string[] = [];

  for (const doc of documents ?? []) {
    const conversion = getConversion(doc);
    if (!conversion) {
      skipped.push(doc.id);
      continue;
    }

    const daysUntilGoLive = daysBetween(today, parseDateOnly(conversion.go_live_date));
    const dueForReminder =
      doc.date_last_reminded === null ||
      daysBetween(toUTCDateOnlyFromTimestamp(doc.date_last_reminded), today) >
        REMINDER_COOLDOWN_DAYS;
    const entry: ActionEntry = {
      facilityName: conversion.facility_name,
      documentName: doc.name,
      category: doc.category,
      daysUntilGoLive,
    };

    if (doc.category === "financial") {
      if (daysUntilGoLive <= FINANCIAL_WINDOW_DAYS && dueForReminder) {
        const { error: updateError } = await supabase
          .from("documents")
          .update({ date_last_reminded: nowIso })
          .eq("id", doc.id);
        if (!updateError) {
          remindersSent.push(entry);
          console.log(`[reminder] financial doc ${doc.id} (${doc.name}) reminded`);
        }
      }
      continue;
    }

    if (doc.category === "site_build") {
      // Evaluated against the status as fetched this run, so a document
      // that just gets auto-marked "sent" below doesn't also fire the
      // reminder in the same run.
      const wasNotSent = doc.status === "not_sent";
      const wasSent = doc.status === "sent";

      if (daysUntilGoLive <= SITE_BUILD_SEND_WINDOW_DAYS && wasNotSent) {
        const { error: updateError } = await supabase
          .from("documents")
          .update({ status: "sent", date_sent: nowIso })
          .eq("id", doc.id);
        if (!updateError) {
          markedSent.push(entry);
          console.log(`[reminder] site_build doc ${doc.id} (${doc.name}) marked sent`);
        }
      } else if (
        daysUntilGoLive <= SITE_BUILD_REMINDER_WINDOW_DAYS &&
        wasSent &&
        dueForReminder
      ) {
        const { error: updateError } = await supabase
          .from("documents")
          .update({ date_last_reminded: nowIso })
          .eq("id", doc.id);
        if (!updateError) {
          remindersSent.push(entry);
          console.log(`[reminder] site_build doc ${doc.id} (${doc.name}) reminded`);
        }
      }
    }
  }

  let emailError: string | null = null;
  if (!process.env.RESEND_API_KEY) {
    emailError = "RESEND_API_KEY is not set — email skipped";
    console.error(emailError);
  } else {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: REMINDER_EMAIL_FROM,
        to: REMINDER_EMAIL_TO,
        subject: `Document Reminders — ${todayStr}`,
        text: buildEmailBody(remindersSent, markedSent),
      });
    } catch (err) {
      emailError = err instanceof Error ? err.message : String(err);
      console.error("Failed to send reminder email:", err);
    }
  }

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    checked: documents?.length ?? 0,
    markedSent,
    remindersSent,
    skipped,
    emailError,
  });
}
