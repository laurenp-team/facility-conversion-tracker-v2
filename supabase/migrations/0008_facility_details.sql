-- "Facility details" section on the Conversion Record: ADP + three
-- provider cards (Trust Accounting Software, JMS, Phone Provider).
-- All nullable - gathered progressively, not all at once.
--
-- Field naming note: jms_* and phone_provider_* are intentionally kept
-- stable here for an upcoming health-score feature that will treat them
-- as a high-urgency risk category (critical if unknown within 4 weeks of
-- go-live). trust_* is reference-only and won't feed that logic.
-- Run once in the Supabase SQL Editor.

alter table conversions add column adp integer;

alter table conversions add column trust_software_name text;
alter table conversions add column trust_contact_name text;
alter table conversions add column trust_contact_email text;
alter table conversions add column trust_contact_phone text;

alter table conversions add column jms_name text;
alter table conversions add column jms_contact_name text;
alter table conversions add column jms_contact_email text;
alter table conversions add column jms_contact_phone text;

alter table conversions add column phone_provider_name text;
alter table conversions add column phone_provider_contact_name text;
alter table conversions add column phone_provider_contact_email text;
alter table conversions add column phone_provider_contact_phone text;
