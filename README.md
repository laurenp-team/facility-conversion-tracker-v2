Facility Conversion Tracker

Internal tool for tracking correctional facility software installs ("conversions"). This version is a capstone build on top of an earlier Module 5 assignment, kept as a separate deployment.

Live app: https://facility-conversion-tracker-v2.vercel.app

What it does
Home page: create a conversion, list existing ones with a health score badge.
Conversion Record: health score summary, facility info, contacts, and facility details (ADP, trust accounting, JMS, phone provider).
Documents: financial and site-build document tracking, with overdue flagging.
Issue Log: log onsite issues, Claude classifies each as resolvable onsite or needing escalation.
Hardware: tracks ordered hardware, status, and expected delivery.
Settings: tracks the 23 settings that need to be configured before go-live.
Onsite Schedule: facility requirements, team onsite, and training sessions.
Health score

Each conversion gets a calculated risk flag (on track, at risk, critical), based on documents, hardware, settings, and facility details against go-live thresholds. Claude handles two things: classifying new issues, and reading comments on open issues to tell if they're actively being worked or stalled. Claude doesn't decide the flag itself, that's fixed logic.

Stack

Next.js, TypeScript, Supabase, Anthropic API (claude-sonnet-5), deployed on Vercel.
