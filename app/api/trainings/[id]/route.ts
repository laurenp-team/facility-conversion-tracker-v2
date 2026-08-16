import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const VALID_TRAINING_TYPES = ["general_staff", "admin", "medical", "finance", "other"];

// Backs the row-level "Edit" action — plain write, no Claude call.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, string | null> = {};

  if (body.training_type !== undefined) {
    if (!VALID_TRAINING_TYPES.includes(body.training_type)) {
      return NextResponse.json(
        { error: `training_type must be one of ${VALID_TRAINING_TYPES.join(", ")}` },
        { status: 400 }
      );
    }
    updates.training_type = body.training_type;
  }

  if (body.date !== undefined) {
    updates.date = typeof body.date === "string" && body.date ? body.date : null;
  }

  if (body.time !== undefined) {
    updates.time = typeof body.time === "string" && body.time ? body.time : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("trainings")
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

  const { error } = await supabase.from("trainings").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
