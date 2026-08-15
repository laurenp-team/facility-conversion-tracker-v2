-- Adds Main/Finance/IT contact fields to conversions, per the original 5A
-- design's "Contacts" data (name, phone, email per contact) — cut from the
-- 5B MVP scope, added back per user request. Run once in the SQL Editor.

alter table conversions add column main_contact_name text;
alter table conversions add column main_contact_email text;
alter table conversions add column main_contact_phone text;

alter table conversions add column finance_contact_name text;
alter table conversions add column finance_contact_email text;
alter table conversions add column finance_contact_phone text;

alter table conversions add column it_contact_name text;
alter table conversions add column it_contact_email text;
alter table conversions add column it_contact_phone text;
