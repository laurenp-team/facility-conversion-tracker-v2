import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// "Add requirement" — plain write, no Claude call.
export async function POST(request: Request) {
  const body = await request.json();
  const conversion_id = body.conversion_id;
  const requirement_name =
    typeof body.requirement_name === "string" ? body.requirement_name.trim() : "";

  if (!conversion_id || !requirement_name) {
    return NextResponse.json(
      { error: "conversion_id and requirement_name are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("onsite_requirements")
    .insert({ conversion_id, requirement_name })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
