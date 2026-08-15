-- Initial schema for the Facility Conversion Tracker (5B build spec).
-- Run this once in the Supabase SQL Editor for the project.

create table conversions (
  id uuid primary key default gen_random_uuid(),
  facility_name text not null,
  go_live_date date not null,
  created_at timestamp default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  conversion_id uuid references conversions(id),
  name text not null,
  category text check (category in ('financial','site_build')),
  status text check (status in ('not_sent','sent','received','approved')) default 'not_sent',
  date_sent date,
  date_last_reminded date
);

create table issues (
  id uuid primary key default gen_random_uuid(),
  conversion_id uuid references conversions(id),
  description text not null,
  classification text check (classification in ('resolvable_onsite','needs_escalation')),
  date_logged timestamp default now(),
  resolved boolean default false,
  date_resolved timestamp
);
