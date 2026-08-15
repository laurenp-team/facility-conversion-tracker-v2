import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Adds a comment to an issue's running log (e.g. "part ordered"). Plain
// write, no Claude call.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";

  if (!comment) {
    return NextResponse.json({ error: "comment is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("issue_comments")
    .insert({ issue_id: id, comment })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
