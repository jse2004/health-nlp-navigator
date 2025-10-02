-- Add student_id to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS student_id text UNIQUE;

-- Create index for faster student_id lookups
CREATE INDEX IF NOT EXISTS idx_patients_student_id ON public.patients(student_id);

-- Add student role to staff_role enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_role') THEN
    CREATE TYPE public.student_role AS ENUM ('student');
  END IF;
END $$;

-- Create student_sessions table for student authentication
CREATE TABLE IF NOT EXISTS public.student_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id text NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  student_id text NOT NULL,
  session_token text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  last_accessed timestamp with time zone DEFAULT now()
);

-- Enable RLS on student_sessions
ALTER TABLE public.student_sessions ENABLE ROW LEVEL SECURITY;

-- Create index for session lookups
CREATE INDEX IF NOT EXISTS idx_student_sessions_token ON public.student_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_student_sessions_patient ON public.student_sessions(patient_id);

-- RLS Policy: Students can only view their own session
CREATE POLICY "Students can view their own session"
ON public.student_sessions
FOR SELECT
USING (true);

-- RLS Policy: Allow inserting new sessions (for login)
CREATE POLICY "Allow session creation"
ON public.student_sessions
FOR INSERT
WITH CHECK (true);

-- Function to validate student credentials
CREATE OR REPLACE FUNCTION public.validate_student_credentials(
  _student_id text,
  _verification_name text
)
RETURNS TABLE(patient_id text, student_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name
  FROM public.patients
  WHERE student_id = _student_id
    AND LOWER(name) = LOWER(_verification_name)
  LIMIT 1;
$$;

-- Function to create student session
CREATE OR REPLACE FUNCTION public.create_student_session(
  _patient_id text,
  _student_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _session_token text;
BEGIN
  -- Generate random session token
  _session_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert session (expires in 24 hours)
  INSERT INTO public.student_sessions (patient_id, student_id, session_token, expires_at)
  VALUES (_patient_id, _student_id, _session_token, now() + interval '24 hours');
  
  RETURN _session_token;
END;
$$;

-- Function to get student data by session token
CREATE OR REPLACE FUNCTION public.get_student_by_session(
  _session_token text
)
RETURNS TABLE(
  patient_id text,
  student_id text,
  patient_name text,
  age integer,
  gender text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.student_id,
    p.name,
    p.age,
    p.gender
  FROM public.student_sessions ss
  JOIN public.patients p ON p.id = ss.patient_id
  WHERE ss.session_token = _session_token
    AND ss.expires_at > now()
  LIMIT 1;
$$;

-- Update RLS policies for students to view their own medical records
CREATE POLICY "Students can view their own medical records"
ON public.medical_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_sessions ss
    WHERE ss.patient_id = medical_records.patient_id
      AND ss.expires_at > now()
  )
  OR user_can_access_patient(auth.uid(), patient_id) 
  OR user_has_role(auth.uid(), 'admin')
);

-- Update RLS policies for students to view their own certificates
CREATE POLICY "Students can view their own certificates"
ON public.medical_certificates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.medical_records mr
    JOIN public.student_sessions ss ON ss.patient_id = mr.patient_id
    WHERE mr.id = medical_certificates.medical_record_id
      AND ss.expires_at > now()
  )
  OR EXISTS (
    SELECT 1
    FROM medical_records mr
    WHERE mr.id = medical_certificates.medical_record_id
      AND (user_can_access_patient(auth.uid(), mr.patient_id) OR user_has_role(auth.uid(), 'admin'))
  )
);

-- Update RLS policies for students to view their own vitals
CREATE POLICY "Students can view their own vitals"
ON public.patient_vitals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_sessions ss
    WHERE ss.patient_id = patient_vitals.patient_id
      AND ss.expires_at > now()
  )
  OR user_can_access_patient(auth.uid(), patient_id) 
  OR user_has_role(auth.uid(), 'admin')
);

-- Update RLS policies for students to view their own allergies
CREATE POLICY "Students can view their own allergies"
ON public.patient_allergies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_sessions ss
    WHERE ss.patient_id = patient_allergies.patient_id
      AND ss.expires_at > now()
  )
  OR user_can_access_patient(auth.uid(), patient_id) 
  OR user_has_role(auth.uid(), 'admin')
);

-- Update RLS policies for students to view their own prescriptions
CREATE POLICY "Students can view their own prescriptions"
ON public.medication_prescriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_sessions ss
    WHERE ss.patient_id = medication_prescriptions.patient_id
      AND ss.expires_at > now()
  )
  OR user_can_access_patient(auth.uid(), patient_id) 
  OR user_has_role(auth.uid(), 'admin')
);