# Facility Conversion Tracker

Internal tool for tracking correctional facility software installs ("conversions"). Built from a 5A process design (internal document, not included in this repo), scoped down to an MVP per [`docs/5B_Build_Spec.md`](docs/5B_Build_Spec.md).

**Live app:** https://facility-conversion-tracker.vercel.app

## What it does

- **Home page** (`/`): create a conversion (facility name and go-live date), list existing ones.
- **Conversion Record** (`/conversions/[id]`): facility name, go-live date with a live "go-live in/was X days" indicator, and Main/Finance/IT contact info (name, email, phone). All editable.
- **Documents** (`/conversions/[id]/documents`): tracks financial and site-build documents per conversion, with name, category, status, date sent, and date last reminded. You can add, edit, delete, and update status. Overdue documents (past go-live and not received or approved) get flagged with a red border.
- **Issue Log** (`/conversions/[id]/issues`): log an issue from onsite go-live week, and Claude classifies it as `resolvable_onsite` or `needs_escalation`. Issues can be edited, resolved, deleted, and commented on, so you can leave a running note like "part ordered" or "technician scheduled." Open issues sort with `needs_escalation` first.

## Scheduled vs. on-demand

**Scheduled:** [`app/api/cron/reminders/route.ts`](app/api/cron/reminders/route.ts). A Vercel Cron job (see [`vercel.json`](vercel.json)) runs once daily, checking every outstanding document's status against its conversion's go-live date. It sends reminders (financial docs at 3 weeks out; site-build docs auto-send at 4 weeks out and get a reminder at 2 weeks out, capped at one reminder per document per 7 days), and emails a daily summary through Resend. This piece runs on dates alone, no Claude call involved.

**On-demand:** [`app/api/issues/triage/route.ts`](app/api/issues/triage/route.ts). This is the "Submit for triage" button on the Issue Log. It sends the issue description to Claude with the classification prompt and examples pulled from the 5A design, then saves the returned classification against the issue. This is the app's one agentic step, the only spot where a real judgment call (does this need a part, a shipment, or dev work, or can the tech handle it right now) gets handed to Claude instead of hardcoded. If Claude's response doesn't exactly match one of the two labels, or the API call fails, it defaults to `needs_escalation`, so ambiguous cases fail toward the safer, human-reviewed path.

## Stack

Built with Next.js (App Router) and TypeScript. Supabase (Postgres) handles the database, accessed server-side only via the `service_role` key, no client-side DB access. The Anthropic API (`claude-sonnet-5`) runs the triage step, and Resend sends the reminder email. Deployed on Vercel.

## Database

Three tables (`conversions`, `documents`, `issues`) plus `issue_comments`. Schema and all migrations live in [`supabase/migrations/`](supabase/migrations/), applied in order through the Supabase SQL Editor.

## Environment variables

See [`.env.example`](.env.example): `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`. All secrets live in `.env.local` (gitignored) locally and in Vercel's encrypted environment variable store in production, nothing hardcoded or committed.

## Local development

```bash
npm install
npm run dev
```
