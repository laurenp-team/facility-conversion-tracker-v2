import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Backs "Mark resolved" and the "Edit" action on an issue — plain writes,
// no Claude call. "Mark resolved" sends { resolved: true }; "Edit" sends
// { description }. Classification stays Claude-only, not manually editable.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const updates: Record<string, string | boolean> = {};

  if (body.description !== undefined) {
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    if (!description) {
      return NextResponse.json(
        { error: "description cannot be empty" },
        { status: 400 }
      );
    }
    updates.description = description;
  }

  if (body.resolved === true) {
    updates.resolved = true;
    updates.date_resolved = new Date().toISOString();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("issues")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// The row-level "Delete" action. Comments have no ON DELETE CASCADE, so
// they're removed first.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error: commentsError } = await supabase
    .from("issue_comments")
    .delete()
    .eq("issue_id", id);

  if (commentsError) {
    return NextResponse.json({ error: commentsError.message }, { status: 500 });
  }

  const { error } = await supabase.from("issues").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
