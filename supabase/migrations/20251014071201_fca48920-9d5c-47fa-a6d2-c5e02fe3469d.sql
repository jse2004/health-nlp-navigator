-- Ensure pgcrypto extension is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop and recreate the create_student_session function to ensure it works
DROP FUNCTION IF EXISTS public.create_student_session(text, text);

CREATE OR REPLACE FUNCTION public.create_student_session(_patient_id text, _student_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _session_token text;
BEGIN
  -- Generate random session token using pgcrypto
  _session_token := encode(gen_random_bytes(32), 'hex');
  
  -- Delete any existing sessions for this student
  DELETE FROM public.student_sessions 
  WHERE student_id = _student_id;
  
  -- Insert new session (expires in 24 hours)
  INSERT INTO public.student_sessions (patient_id, student_id, session_token, expires_at)
  VALUES (_patient_id, _student_id, _session_token, now() + interval '24 hours');
  
  RETURN _session_token;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create session: %', SQLERRM;
END;
$$;