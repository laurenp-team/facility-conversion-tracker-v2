# 5B build spec: Facility Conversion Tracker (MVP)

Refined from the 5A design. This is the version to hand to Claude Code.

## Screens

### 1. Conversion record
- Facility name (text)
- Go-live date (date)
- Documents table: name, category (financial / site build), status (not sent / sent / received / approved), date sent, date last reminded
- Buttons: "Add document," "Update status"

### 2. Issue log
- Linked to a conversion record
- Issue description (text)
- Button: "Submit for triage" - calls Claude, saves the returned classification
- Displays: classification (resolvable onsite / needs escalation), date logged, resolved (yes/no), date resolved

## Database schema

```sql
conversions (
  id uuid primary key default gen_random_uuid(),
  facility_name text not null,
  go_live_date date not null,
  created_at timestamp default now()
)

documents (
  id uuid primary key default gen_random_uuid(),
  conversion_id uuid references conversions(id),
  name text not null,
  category text check (category in ('financial','site_build')),
  status text check (status in ('not_sent','sent','received','approved')) default 'not_sent',
  date_sent date,
  date_last_reminded date
)

issues (
  id uuid primary key default gen_random_uuid(),
  conversion_id uuid references conversions(id),
  description text not null,
  classification text check (classification in ('resolvable_onsite','needs_escalation')),
  date_logged timestamp default now(),
  resolved boolean default false,
  date_resolved timestamp
)
```

## Scheduled piece: document reminder engine (cron, daily)

Runs once a day. For every document with `status` not in `('received','approved')`:

- **Financial docs:** if today is 3 weeks or less before `go_live_date` and `date_last_reminded` is null or more than 7 days ago, send a reminder and update `date_last_reminded`.
- **Site build docs:** if today is 4 weeks or less before `go_live_date` and `status = 'not_sent'`, mark as sent and set `date_sent`. If today is 2 weeks or less before `go_live_date` and status is still `sent`, and `date_last_reminded` is null or more than 7 days ago, send a reminder and update `date_last_reminded`.

Edge cases to build in explicitly:
- If a document's status is updated to `received` or `approved` between cron runs, it drops out of the reminder pool on the next run automatically since the query filters on status.
- If `go_live_date` changes after reminders have already gone out, the cron just recalculates against the new date on its next run. No separate "go-live changed" handler needed since the reminder logic is date-driven, not state-driven.
- Cap: no more than one reminder per document per 7 days, so a delayed cron run doesn't double-send.

## On-demand piece: issue triage button

PM submits an issue description. The app sends it to Claude with the prompt below and saves the returned classification against that issue.

**Prompt for Claude Code to implement:**

```
You are classifying a facility conversion issue reported by a Project Manager onsite.

Classify the issue as exactly one of:
- resolvable_onsite: the tech or PM already has what they need to fix it right there.
- needs_escalation: it requires something the onsite team doesn't have on hand - a part, a shipment, or development work.

Examples of resolvable_onsite:
- Camera not working, computer not connecting to internet, kiosk not bolted to the ground, barcode scanner not installed
- Site charge price update, commissary indigent parameters not set, phone time transfer button not on tablet, user doesn't have correct permissions

Examples of needs_escalation:
- No parts on hand for a broken touchscreen, receipt printer never shipped and a replacement is needed
- Facility needs functionality that isn't in the software and requires development work

Issue description: {description}

Respond with only one of: resolvable_onsite or needs_escalation. No other text.
```

Notes for the build:
- Set an explicit higher execution time limit on this function specifically, since Claude's response can be slow.
- If Claude's response doesn't exactly match one of the two strings, treat it as `needs_escalation` by default (fail toward the safer, human-reviewed path, not the auto-resolved one).

## Deferred (confirmed out of scope for 5B)

Dashboard, Document Tracker as its own screen, Effective Meeting Intake Form, hardware/shipping tracking, vending fields, Staff Accounts and Training, post-go-live check-in tracking, reconciliation-as-Claude-call. All per 5A's MVP scope decision.
