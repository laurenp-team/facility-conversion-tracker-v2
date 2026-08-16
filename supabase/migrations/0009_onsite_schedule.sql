-- Onsite Schedule page: facility requirements, team onsite, trainings.
-- Reference/logistics only - none of this feeds the health-score feature.
-- Run once in the Supabase SQL Editor.

create table onsite_requirements (
  id uuid primary key default gen_random_uuid(),
  conversion_id uuid references conversions(id),
  requirement_name text not null,
  status text check (status in ('needed','provided')) default 'needed'
);

create table onsite_team (
  id uuid primary key default gen_random_uuid(),
  conversion_id uuid references conversions(id),
  staff_name text not null
);

create table trainings (
  id uuid primary key default gen_random_uuid(),
  conversion_id uuid references conversions(id),
  training_type text check (training_type in ('general_staff','admin','medical','finance','other')),
  date date,
  time time
);

alter table onsite_requirements enable row level security;
alter table onsite_team enable row level security;
alter table trainings enable row level security;
