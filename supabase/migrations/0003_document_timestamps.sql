-- Widens date_sent/date_last_reminded from date to timestamp, so multiple
-- cron runs on the same day (e.g. manual testing) can be told apart. Run
-- this once in the Supabase SQL Editor. Existing values keep their date,
-- just gain a midnight time component.

alter table documents alter column date_sent type timestamp;
alter table documents alter column date_last_reminded type timestamp;
