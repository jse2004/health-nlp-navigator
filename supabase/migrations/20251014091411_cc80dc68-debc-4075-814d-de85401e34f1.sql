-- Helper normalization functions for robust comparisons
CREATE OR REPLACE FUNCTION public.normalize_text(_t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(lower(trim(coalesce(_t, ''))), '\\s+', ' ', 'g');
$$;

CREATE OR REPLACE FUNCTION public.normalize_id(_t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(lower(trim(coalesce(_t, ''))), '[^a-z0-9]', '', 'g');
$$;

-- Improve credential validation to use normalized comparisons
DROP FUNCTION IF EXISTS public.validate_student_credentials(text, text);
CREATE OR REPLACE FUNCTION public.validate_student_credentials(_student_id text, _verification_name text)
RETURNS TABLE(patient_id text, student_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT id, name
  FROM public.patients
  WHERE normalize_id(student_id) = normalize_id(_student_id)
    AND normalize_text(name) = normalize_text(_verification_name)
  LIMIT 1;
$function$;

-- Optional: functional index to speed lookups by normalized student_id
CREATE INDEX IF NOT EXISTS idx_patients_student_id_norm
ON public.patients ((regexp_replace(lower(trim(student_id)), '[^a-z0-9]', '', 'g')));
