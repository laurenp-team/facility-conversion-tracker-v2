import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// "Add staff" — plain write, no Claude call.
export async function POST(request: Request) {
  const body = await request.json();
  const conversion_id = body.conversion_id;
  const staff_name = typeof body.staff_name === "string" ? body.staff_name.trim() : "";

  if (!conversion_id || !staff_name) {
    return NextResponse.json(
      { error: "conversion_id and staff_name are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("onsite_team")
    .insert({ conversion_id, staff_name })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
