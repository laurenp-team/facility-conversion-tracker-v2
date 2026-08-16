-- Hardware tracking per conversion. Run once in the Supabase SQL Editor.

create table hardware (
  id uuid primary key default gen_random_uuid(),
  conversion_id uuid references conversions(id),
  item_name text not null,
  status text check (status in ('not_ordered','ordered','shipped','delivered')) default 'not_ordered',
  expected_delivery_date date
);

alter table hardware enable row level security;
