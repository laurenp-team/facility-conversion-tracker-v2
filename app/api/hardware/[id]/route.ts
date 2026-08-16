import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const VALID_STATUSES = ["not_ordered", "ordered", "shipped", "delivered"];

// Backs "Update status" and the row-level "Edit" action — plain writes,
// no Claude call.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, string | null> = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }
    updates.status = body.status;
  }

  if (body.item_name !== undefined) {
    const item_name = typeof body.item_name === "string" ? body.item_name.trim() : "";
    if (!item_name) {
      return NextResponse.json({ error: "item_name cannot be empty" }, { status: 400 });
    }
    updates.item_name = item_name;
  }

  if (body.expected_delivery_date !== undefined) {
    updates.expected_delivery_date =
      typeof body.expected_delivery_date === "string" && body.expected_delivery_date
        ? body.expected_delivery_date
        : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("hardware")
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

  const { error } = await supabase.from("hardware").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
