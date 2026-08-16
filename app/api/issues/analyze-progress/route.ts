import { NextResponse } from "next/server";
import { analyzeCommentProgress } from "@/lib/analyze-progress";

// Explicit higher execution time limit for this function specifically, since
// a slow Claude response can otherwise get cut off before it returns —
// same reasoning as the triage route.
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json();
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";

  if (!comment) {
    return NextResponse.json({ error: "comment is required" }, { status: 400 });
  }

  const currentDate =
    typeof body.current_date === "string" && body.current_date
      ? body.current_date
      : new Date().toISOString().slice(0, 10);

  const result = await analyzeCommentProgress(comment, currentDate);
  return NextResponse.json(result);
}
