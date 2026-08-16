import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const VALID_STATUSES = ["not_sent", "sent", "received", "approved"];
const VALID_CATEGORIES = ["financial", "site_build"];

// Backs "Update status" and the row-level "Edit" action — plain writes to
// the documents table, no Claude call.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, string> = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }
    updates.status = body.status;

    // date_sent was previously only ever stamped by the reminders cron (and
    // only for site_build's automatic not_sent -> sent transition), so a
    // manual "Update status" via this endpoint left it blank forever —
    // financial docs in particular never got a date_sent at all. Stamp it
    // here the first time a document leaves "not_sent", regardless of which
    // status it lands on, so manual updates behave the same as the cron.
    if (body.status !== "not_sent") {
      const { data: existing } = await supabase
        .from("documents")
        .select("date_sent")
        .eq("id", id)
        .single();
      if (existing && !existing.date_sent) {
        updates.date_sent = new Date().toISOString();
      }
    }
  }

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    }
    updates.name = name;
  }

  if (body.category !== undefined) {
    if (!VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json(
        { error: `category must be one of ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }
    updates.category = body.category;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("documents")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// The row-level "Delete" action.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase.from("documents").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
