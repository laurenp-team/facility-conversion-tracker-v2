-- Adds a running comment log per issue (e.g. "part ordered", "submitted to
-- development", "technician scheduled"). Added after the initial 5B build
-- per user request. Run this once in the Supabase SQL Editor.

create table issue_comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references issues(id),
  comment text not null,
  created_at timestamp default now()
);
