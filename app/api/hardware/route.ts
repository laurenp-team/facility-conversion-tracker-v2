import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// "Add hardware item" — plain write, no Claude call.
export async function POST(request: Request) {
  const body = await request.json();
  const conversion_id = body.conversion_id;
  const item_name = typeof body.item_name === "string" ? body.item_name.trim() : "";

  if (!conversion_id || !item_name) {
    return NextResponse.json(
      { error: "conversion_id and item_name are required" },
      { status: 400 }
    );
  }

  const expected_delivery_date =
    typeof body.expected_delivery_date === "string" && body.expected_delivery_date
      ? body.expected_delivery_date
      : null;

  const { data, error } = await supabase
    .from("hardware")
    .insert({ conversion_id, item_name, expected_delivery_date })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
