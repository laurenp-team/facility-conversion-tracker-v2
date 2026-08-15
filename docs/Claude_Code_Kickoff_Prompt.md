# Claude Code kickoff prompt

Paste this into Claude Code to start the build. Attach 5B_Build_Spec.md alongside it, or paste its contents in below the prompt so Claude Code has the schema, reminder logic, and triage prompt in context.

---

I'm building a facility conversion tracker for correctional facility software installs. Here's the full spec (schema, screens, scheduled logic, and the Claude prompt for the agentic step) - build to this exactly, don't improvise scope beyond it:

[paste contents of 5B_Build_Spec.md here]

Build order:

1. Set up a new GitHub repo for this project.
2. Set up a new Supabase project. Create the three tables exactly as specified in the schema above: conversions, documents, issues.
3. Connect the repo to a new Vercel project.
4. Scaffold the frontend: two screens, Conversion Record and Issue Log, matching the fields and buttons described in the spec. Keep the UI simple and functional, this is an MVP.
5. Build the "Add document" and "Update status" actions as plain serverless functions, no Claude call involved, they're just writes to the documents table.
6. Build the issue triage button as an on-demand serverless function: it takes the issue description, calls the Anthropic API with the exact prompt template in the spec, and saves the returned classification against the issue. Set an explicit higher execution time limit on this function specifically, since a slow Claude response can otherwise get cut off before it returns. If Claude's response doesn't exactly match "resolvable_onsite" or "needs_escalation," default to "needs_escalation".
7. Build the document reminder engine as a Vercel Cron job running once daily. Implement the financial and site build timing rules exactly as specified, including the 7-day cap on repeat reminders.
8. Set up environment variables for both Supabase keys and the Anthropic API key. Add them to my local .env and confirm they're also set in the Vercel dashboard. Do a final check for any hardcoded keys before we push.
9. Deploy. Then help me test both automation pieces: walk me through manually triggering the issue triage button, and tell me the direct URL I can visit in the browser to confirm the cron job's logic runs correctly without waiting a full day.

Ask me before making any scope decisions not covered in the spec above.
