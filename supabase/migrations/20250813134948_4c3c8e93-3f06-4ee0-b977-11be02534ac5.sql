-- Continue fixing security vulnerability: Update existing table policies (handling existing policies)
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Authenticated users can view patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can delete patients" ON public.patients;
DROP POLICY IF EXISTS "Staff can view assigned patients" ON public.patients;
DROP POLICY IF EXISTS "Admins and doctors can create patients" ON public.patients;
DROP POLICY IF EXISTS "Staff can update assigned patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can delete patients" ON public.patients;

DROP POLICY IF EXISTS "Authenticated users can view medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Authenticated users can insert medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Authenticated users can update medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Authenticated users can delete medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Staff can view medical records for assigned patients" ON public.medical_records;
DROP POLICY IF EXISTS "Staff can create medical records for assigned patients" ON public.medical_records;
DROP POLICY IF EXISTS "Staff can update medical records for assigned patients" ON public.medical_records;
DROP POLICY IF EXISTS "Admins and doctors can delete medical records" ON public.medical_records;

DROP POLICY IF EXISTS "Allow authenticated users to view certificates" ON public.medical_certificates;
DROP POLICY IF EXISTS "Allow authenticated users to create certificates" ON public.medical_certificates;
DROP POLICY IF EXISTS "Staff can view certificates for assigned patients" ON public.medical_certificates;
DROP POLICY IF EXISTS "Staff can create certificates for assigned patients" ON public.medical_certificates;

-- Create secure policies for patients table
CREATE POLICY "Staff can view assigned patients"
ON public.patients
FOR SELECT
TO authenticated
USING (public.user_can_access_patient(auth.uid(), id) OR public.user_has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and doctors can create patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (public.user_has_role(auth.uid(), 'admin') OR public.user_has_role(auth.uid(), 'doctor'));

CREATE POLICY "Staff can update assigned patients"
ON public.patients
FOR UPDATE
TO authenticated
USING (public.user_can_access_patient(auth.uid(), id) OR public.user_has_role(auth.uid(), 'admin'))
WITH CHECK (public.user_can_access_patient(auth.uid(), id) OR public.user_has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete patients"
ON public.patients
FOR DELETE
TO authenticated
USING (public.user_has_role(auth.uid(), 'admin'));

-- Create secure policies for medical_records table
CREATE POLICY "Staff can view medical records for assigned patients"
ON public.medical_records
FOR SELECT
TO authenticated
USING (public.user_can_access_patient(auth.uid(), patient_id) OR public.user_has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can create medical records for assigned patients"
ON public.medical_records
FOR INSERT
TO authenticated
WITH CHECK (public.user_can_access_patient(auth.uid(), patient_id) OR public.user_has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can update medical records for assigned patients"
ON public.medical_records
FOR UPDATE
TO authenticated
USING (public.user_can_access_patient(auth.uid(), patient_id) OR public.user_has_role(auth.uid(), 'admin'))
WITH CHECK (public.user_can_access_patient(auth.uid(), patient_id) OR public.user_has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and doctors can delete medical records"
ON public.medical_records
FOR DELETE
TO authenticated
USING (public.user_has_role(auth.uid(), 'admin') OR public.user_has_role(auth.uid(), 'doctor'));

-- Create secure policies for medical certificates
CREATE POLICY "Staff can view certificates for assigned patients"
ON public.medical_certificates
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.medical_records mr 
        WHERE mr.id = medical_record_id 
        AND (public.user_can_access_patient(auth.uid(), mr.patient_id) OR public.user_has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Staff can create certificates for assigned patients"
ON public.medical_certificates
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.medical_records mr 
        WHERE mr.id = medical_record_id 
        AND (public.user_can_access_patient(auth.uid(), mr.patient_id) OR public.user_has_role(auth.uid(), 'admin'))
    )
);