import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const VALID_TRAINING_TYPES = ["general_staff", "admin", "medical", "finance", "other"];

// "Add training" — plain write, no Claude call.
export async function POST(request: Request) {
  const body = await request.json();
  const conversion_id = body.conversion_id;
  const training_type = body.training_type;

  if (!conversion_id || !VALID_TRAINING_TYPES.includes(training_type)) {
    return NextResponse.json(
      {
        error: `conversion_id is required and training_type must be one of ${VALID_TRAINING_TYPES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  const date = typeof body.date === "string" && body.date ? body.date : null;
  const time = typeof body.time === "string" && body.time ? body.time : null;

  const { data, error } = await supabase
    .from("trainings")
    .insert({ conversion_id, training_type, date, time })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
