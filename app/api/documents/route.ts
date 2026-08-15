import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const VALID_CATEGORIES = ["financial", "site_build"];

// "Add document" button — plain write to the documents table, no Claude call.
export async function POST(request: Request) {
  const body = await request.json();
  const conversion_id = body.conversion_id;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const category = body.category;

  if (!conversion_id || !name) {
    return NextResponse.json(
      { error: "conversion_id and name are required" },
      { status: 400 }
    );
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: `category must be one of ${VALID_CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({ conversion_id, name, category })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
