import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Not part of the 5B spec's screens directly, but needed so conversions can
// be created at all (the spec defines the Conversion Record screen's fields,
// not a creation flow) — confirmed with the user as minimal home-page plumbing.
export async function POST(request: Request) {
  const body = await request.json();
  const facility_name =
    typeof body.facility_name === "string" ? body.facility_name.trim() : "";
  const go_live_date =
    typeof body.go_live_date === "string" ? body.go_live_date : "";

  if (!facility_name || !go_live_date) {
    return NextResponse.json(
      { error: "facility_name and go_live_date are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("conversions")
    .insert({ facility_name, go_live_date })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
