-- Fix: allow 'student' in clearance_records person_type check constraint
BEGIN;

ALTER TABLE public.clearance_records
  DROP CONSTRAINT IF EXISTS clearance_records_person_type_check;

ALTER TABLE public.clearance_records
  ADD CONSTRAINT clearance_records_person_type_check
  CHECK (
    person_type IS NULL OR person_type IN ('student','professor','employee','guest')
  );

COMMIT;