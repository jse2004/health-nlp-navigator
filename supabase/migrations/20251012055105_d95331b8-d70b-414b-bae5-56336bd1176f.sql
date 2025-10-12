-- Update CHECK constraint to allow 'student' as a valid person_type on medical_records
BEGIN;

ALTER TABLE public.medical_records
  DROP CONSTRAINT IF EXISTS medical_records_person_type_check;

-- Allow null or one of the enumerated values, now including 'student'
ALTER TABLE public.medical_records
  ADD CONSTRAINT medical_records_person_type_check
  CHECK (
    person_type IS NULL OR person_type IN ('student','professor','employee','guest')
  );

COMMIT;