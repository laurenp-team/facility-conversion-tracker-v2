import { supabase } from "./supabase";
import { analyzeCommentProgress } from "./analyze-progress";
import type {
  Conversion,
  DocumentRow,
  HardwareItem,
  SettingRow,
  Issue,
  IssueComment,
} from "./types";

export type HealthFlag = "on_track" | "at_risk" | "critical";

export interface HealthScoreResult {
  flag: HealthFlag;
  reasons: string[];
}

export const HEALTH_FLAG_LABEL: Record<HealthFlag, string> = {
  on_track: "On track",
  at_risk: "At risk",
  critical: "Critical",
};

export const HEALTH_FLAG_COLOR: Record<HealthFlag, "green" | "amber" | "red"> = {
  on_track: "green",
  at_risk: "amber",
  critical: "red",
};

const AT_RISK_WINDOW_DAYS = 14;
const CRITICAL_WINDOW_DAYS = 3;
const JMS_PHONE_WINDOW_DAYS = 28;
const STALL_DAYS = 3;

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toUTCDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// Whole days from `from` to `to` (positive if `to` is later).
function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

// Runs fresh on every call (no caching of prior Claude analyses). Fine at
// current volume; worth revisiting (e.g. caching per-comment results) if
// conversion/issue volume grows significantly.
export async function getHealthScore(conversionId: string): Promise<HealthScoreResult> {
  const [
    { data: conversionData },
    { data: documentsData },
    { data: hardwareData },
    { data: settingsData },
    { data: issuesData },
  ] = await Promise.all([
    supabase.from("conversions").select("*").eq("id", conversionId).single(),
    supabase.from("documents").select("*").eq("conversion_id", conversionId),
    supabase.from("hardware").select("*").eq("conversion_id", conversionId),
    supabase.from("settings").select("*").eq("conversion_id", conversionId),
    supabase.from("issues").select("*").eq("conversion_id", conversionId),
  ]);

  const conversion = conversionData as Conversion | null;
  if (!conversion) {
    return { flag: "on_track", reasons: [] };
  }

  const documents = (documentsData ?? []) as DocumentRow[];
  const hardware = (hardwareData ?? []) as HardwareItem[];
  const settings = (settingsData ?? []) as SettingRow[];
  const issues = (issuesData ?? []) as Issue[];

  const today = todayUTC();
  const goLiveDate = parseDateOnly(conversion.go_live_date);
  const daysUntilGoLive = daysBetween(today, goLiveDate);

  const outstandingDocs = documents.filter(
    (d) => d.status !== "approved" && d.status !== "received"
  );
  const outstandingHardware = hardware.filter((h) => h.status !== "delivered");
  const incompleteSettings = settings.filter((s) => s.status === "not_completed");
  const awaitingInfoSettings = settings.filter((s) => s.status === "awaiting_information");
  const jmsUnknown = !conversion.jms_name;
  const phoneUnknown = !conversion.phone_provider_name;
  const anyOutstandingItem =
    outstandingDocs.length > 0 || outstandingHardware.length > 0 || incompleteSettings.length > 0;

  const reasons: string[] = [];
  let atRisk = false;
  let critical = false;

  function addOutstandingItemReasons() {
    if (outstandingDocs.length > 0) {
      reasons.push(`${outstandingDocs.length} document(s) not yet approved/received`);
    }
    if (outstandingHardware.length > 0) {
      reasons.push(`${outstandingHardware.length} hardware item(s) not yet delivered`);
    }
    if (incompleteSettings.length > 0) {
      reasons.push(`${incompleteSettings.length} setting(s) not completed`);
    }
  }

  function addJmsPhoneReasons() {
    if (jmsUnknown) reasons.push("JMS provider unknown");
    if (phoneUnknown) reasons.push("Phone provider unknown");
  }

  if (daysUntilGoLive >= 0) {
    // --- Pre-go-live ---
    if (anyOutstandingItem && daysUntilGoLive <= AT_RISK_WINDOW_DAYS) {
      atRisk = true;
      addOutstandingItemReasons();
    }

    if (anyOutstandingItem && (daysUntilGoLive <= CRITICAL_WINDOW_DAYS || daysUntilGoLive < 0)) {
      critical = true;
      addOutstandingItemReasons();
    }

    if (awaitingInfoSettings.length > 0 && daysUntilGoLive <= AT_RISK_WINDOW_DAYS) {
      critical = true;
      reasons.push(`${awaitingInfoSettings.length} setting(s) awaiting information`);
    }

    if ((jmsUnknown || phoneUnknown) && daysUntilGoLive <= JMS_PHONE_WINDOW_DAYS) {
      critical = true;
      addJmsPhoneReasons();
    }
  } else {
    // --- Post-go-live ---
    const escalatedOpenIssues = issues.filter(
      (i) => !i.resolved && i.classification === "needs_escalation"
    );

    if (escalatedOpenIssues.length > 0) {
      atRisk = true;
      reasons.push(`${escalatedOpenIssues.length} unresolved escalated issue(s)`);

      const { data: commentsData } = await supabase
        .from("issue_comments")
        .select("*")
        .in(
          "issue_id",
          escalatedOpenIssues.map((i) => i.id)
        )
        .order("created_at", { ascending: true });

      const commentsByIssueId: Record<string, IssueComment[]> = {};
      for (const comment of (commentsData ?? []) as IssueComment[]) {
        (commentsByIssueId[comment.issue_id] ??= []).push(comment);
      }

      const todayStr = today.toISOString().slice(0, 10);

      const stalledResults = await Promise.all(
        escalatedOpenIssues.map(async (issue) => {
          const comments = commentsByIssueId[issue.id] ?? [];

          let category: "progress_with_date" | "progress_no_date" | "no_progress";
          let extractedDate: string | null = null;
          let referenceDate: Date;

          if (comments.length === 0) {
            // Fixed-logic default - no Claude call needed when there's
            // nothing to analyze yet.
            category = "no_progress";
            referenceDate = toUTCDateOnly(new Date(issue.date_logged));
          } else {
            const mostRecent = comments[comments.length - 1];
            const analysis = await analyzeCommentProgress(mostRecent.comment, todayStr);
            category = analysis.category;
            extractedDate = analysis.extracted_date;
            referenceDate = toUTCDateOnly(new Date(mostRecent.created_at));
          }

          const daysSinceReference = daysBetween(referenceDate, today);

          let stalled = false;
          if (category === "no_progress" || category === "progress_no_date") {
            stalled = daysSinceReference >= STALL_DAYS;
          } else if (category === "progress_with_date" && extractedDate) {
            stalled = parseDateOnly(extractedDate).getTime() < today.getTime();
          }

          return stalled;
        })
      );

      const stalledCount = stalledResults.filter(Boolean).length;
      if (stalledCount > 0) {
        critical = true;
        reasons.push(`${stalledCount} escalated issue(s) appear stalled`);
      }
    }

    const unresolvedSettings = settings.filter(
      (s) => s.status !== "completed" && s.status !== "not_applicable"
    );
    const anyPreGoLiveItemUnresolved =
      outstandingDocs.length > 0 ||
      outstandingHardware.length > 0 ||
      unresolvedSettings.length > 0 ||
      jmsUnknown ||
      phoneUnknown;

    if (anyPreGoLiveItemUnresolved) {
      critical = true;
      if (outstandingDocs.length > 0) {
        reasons.push(
          `${outstandingDocs.length} document(s) still not approved/received (go-live has passed)`
        );
      }
      if (outstandingHardware.length > 0) {
        reasons.push(
          `${outstandingHardware.length} hardware item(s) still not delivered (go-live has passed)`
        );
      }
      if (unresolvedSettings.length > 0) {
        reasons.push(
          `${unresolvedSettings.length} setting(s) still not resolved (go-live has passed)`
        );
      }
      addJmsPhoneReasons();
    }
  }

  const flag: HealthFlag = critical ? "critical" : atRisk ? "at_risk" : "on_track";

  return { flag, reasons: [...new Set(reasons)] };
}
