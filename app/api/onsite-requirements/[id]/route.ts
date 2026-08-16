import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const VALID_STATUSES = ["needed", "provided"];

// Backs "Update status" and the row-level "Edit" action — plain writes,
// no Claude call.
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
  }

  if (body.requirement_name !== undefined) {
    const requirement_name =
      typeof body.requirement_name === "string" ? body.requirement_name.trim() : "";
    if (!requirement_name) {
      return NextResponse.json(
        { error: "requirement_name cannot be empty" },
        { status: 400 }
      );
    }
    updates.requirement_name = requirement_name;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("onsite_requirements")
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

  const { error } = await supabase.from("onsite_requirements").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
