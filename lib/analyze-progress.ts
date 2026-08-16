import Anthropic from "@anthropic-ai/sdk";

export type ProgressCategory = "progress_with_date" | "progress_no_date" | "no_progress";

export interface ProgressAnalysis {
  category: ProgressCategory;
  extracted_date: string | null;
}

const VALID_CATEGORIES: ProgressCategory[] = [
  "progress_with_date",
  "progress_no_date",
  "no_progress",
];

const DEFAULT_RESULT: ProgressAnalysis = { category: "no_progress", extracted_date: null };

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are reviewing a single comment left on an open facility-conversion issue that has been escalated for development or hardware follow-up.

Classify the comment into exactly one category:
- "progress_with_date": describes a concrete next step already in motion AND gives a specific date or day.
- "progress_no_date": describes a concrete next step already in motion, but gives no specific date.
- "no_progress": no concrete next step described, vague reassurance, or restating the problem.

Examples:
- "Receipt printer ordered, tracking info: 123456789" -> progress_no_date
- "Submitted to development team for review" -> progress_no_date
- "Tech scheduled to install Tuesday 8/18" -> progress_with_date
- "Building custom commissary restriction for this facility, targeting Friday" -> progress_with_date
- "Still looking into this" -> no_progress
- "Checking with the vendor" -> no_progress

If "progress_with_date," extract the date in YYYY-MM-DD format using the provided current date to resolve relative days. If you cannot confidently resolve a relative date, use "progress_no_date" instead.

Respond with only valid JSON, no other text:
{"category": "progress_with_date" | "progress_no_date" | "no_progress", "extracted_date": "YYYY-MM-DD" | null}`;

// Analyzes a single issue comment for concrete-progress signals. Used both
// by the /api/issues/analyze-progress route (on-demand/testable) and
// directly by lib/healthScore.ts (no HTTP round-trip needed there).
//
// Fail-safe: any parse failure, malformed category, or API error defaults
// to {category: "no_progress", extracted_date: null} - same fail-toward-
// safety principle as the triage endpoint, since this feeds a risk flag
// that should never silently under-report risk.
export async function analyzeCommentProgress(
  commentText: string,
  currentDateStr: string
): Promise<ProgressAnalysis> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 100,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Current date: ${currentDateStr}\n\nComment: ${commentText}`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const raw = textBlock ? textBlock.text.trim() : "";

    const parsed = JSON.parse(raw);

    if (
      parsed &&
      typeof parsed === "object" &&
      VALID_CATEGORIES.includes(parsed.category)
    ) {
      return {
        category: parsed.category,
        extracted_date:
          parsed.category === "progress_with_date" &&
          typeof parsed.extracted_date === "string"
            ? parsed.extracted_date
            : null,
      };
    }
  } catch (err) {
    console.error("analyzeCommentProgress failed:", err);
  }

  return DEFAULT_RESULT;
}
