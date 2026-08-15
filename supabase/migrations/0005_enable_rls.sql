-- Enables Row Level Security on all four tables, with no policies added.
--
-- This app's only database client is lib/supabase.ts, using the
-- SUPABASE_SERVICE_ROLE_KEY exclusively (no client-side Supabase calls
-- exist anywhere in the app). The service_role Postgres role has BYPASSRLS,
-- so it is completely unaffected by RLS regardless of what policies exist
-- - meaning the app's behavior does not change at all after this runs.
--
-- With RLS enabled and zero policies defined, the anon/authenticated roles
-- (i.e. anyone using the publishable/anon key, which this app never issues
-- to a client) get default-deny access to these tables. That's the correct
-- posture here: those roles have no legitimate reason to touch this data
-- at all, so there's no policy to write - just close the door.
--
-- Run once in the Supabase SQL Editor.

alter table conversions enable row level security;
alter table documents enable row level security;
alter table issues enable row level security;
alter table issue_comments enable row level security;
