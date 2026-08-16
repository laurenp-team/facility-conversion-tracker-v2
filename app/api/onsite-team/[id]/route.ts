import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// The row-level "Delete" action. No edit for this table — just names,
// add/delete per spec.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase.from("onsite_team").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
