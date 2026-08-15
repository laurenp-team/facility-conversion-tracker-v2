import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

// Explicit higher execution time limit for this function specifically, since
// a slow Claude response can otherwise get cut off before it returns.
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VALID_CLASSIFICATIONS = ["resolvable_onsite", "needs_escalation"];

// Exact prompt template from the 5B build spec.
function buildPrompt(description: string) {
  return `You are classifying a facility conversion issue reported by a Project Manager onsite.

Classify the issue as exactly one of:
- resolvable_onsite: the tech or PM already has what they need to fix it right there.
- needs_escalation: it requires something the onsite team doesn't have on hand - a part, a shipment, or development work.

Examples of resolvable_onsite:
- Camera not working, computer not connecting to internet, kiosk not bolted to the ground, barcode scanner not installed
- Site charge price update, commissary indigent parameters not set, phone time transfer button not on tablet, user doesn't have correct permissions

Examples of needs_escalation:
- No parts on hand for a broken touchscreen, receipt printer never shipped and a replacement is needed
- Facility needs functionality that isn't in the software and requires development work

Issue description: ${description}

Respond with only one of: resolvable_onsite or needs_escalation. No other text.`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const conversion_id = body.conversion_id;
  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  if (!conversion_id || !description) {
    return NextResponse.json(
      { error: "conversion_id and description are required" },
      { status: 400 }
    );
  }

  // Default per spec: if Claude's response doesn't exactly match one of the
  // two strings, default to needs_escalation (fail toward the safer,
  // human-reviewed path). The same default applies if the API call itself
  // fails (network/timeout/etc.) so the PM's report is never silently lost.
  let classification: (typeof VALID_CLASSIFICATIONS)[number] =
    "needs_escalation";

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 20,
      messages: [{ role: "user", content: buildPrompt(description) }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const raw = textBlock ? textBlock.text.trim() : "";

    if (VALID_CLASSIFICATIONS.includes(raw)) {
      classification = raw as (typeof VALID_CLASSIFICATIONS)[number];
    }
  } catch (err) {
    console.error("Anthropic triage call failed:", err);
  }

  const { data, error } = await supabase
    .from("issues")
    .insert({ conversion_id, description, classification })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
