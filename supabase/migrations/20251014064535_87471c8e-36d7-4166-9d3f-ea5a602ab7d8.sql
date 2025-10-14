-- Fix student credentials validation to handle names with whitespace
CREATE OR REPLACE FUNCTION public.validate_student_credentials(_student_id text, _verification_name text)
RETURNS TABLE(patient_id text, student_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, name
  FROM public.patients
  WHERE student_id = _student_id
    AND LOWER(TRIM(name)) = LOWER(TRIM(_verification_name))
  LIMIT 1;
$$;