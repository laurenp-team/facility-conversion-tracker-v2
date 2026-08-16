-- Site-build settings checklist per conversion. 24 fixed rows get inserted
-- per conversion at creation time (see app/api/conversions/route.ts) --
-- this table only needs status updates, no add/delete from the UI.
-- Run once in the Supabase SQL Editor.

create table settings (
  id uuid primary key default gen_random_uuid(),
  conversion_id uuid references conversions(id),
  setting_name text not null,
  status text check (status in ('completed','not_completed','awaiting_information','not_applicable')) default 'not_completed'
);

alter table settings enable row level security;
