import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Optional — blank is a valid value (clears the field), unlike
// facility_name/go_live_date which are required.
const CONTACT_FIELDS = [
  "main_contact_name",
  "main_contact_email",
  "main_contact_phone",
  "finance_contact_name",
  "finance_contact_email",
  "finance_contact_phone",
  "it_contact_name",
  "it_contact_email",
  "it_contact_phone",
] as const;

// Backs the "Save" button on the Conversion Record screen for editing
// facility_name / go_live_date / contacts. Plain write, no Claude involved.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, string | null> = {};
  if (typeof body.facility_name === "string" && body.facility_name.trim()) {
    updates.facility_name = body.facility_name.trim();
  }
  if (typeof body.go_live_date === "string" && body.go_live_date) {
    updates.go_live_date = body.go_live_date;
  }
  for (const field of CONTACT_FIELDS) {
    if (typeof body[field] === "string") {
      updates[field] = body[field].trim() || null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("conversions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
