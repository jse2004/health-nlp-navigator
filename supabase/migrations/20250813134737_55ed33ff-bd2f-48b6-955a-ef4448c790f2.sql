-- Fix critical security vulnerability: Implement role-based access with patient assignments
-- Create enum for medical staff roles
CREATE TYPE public.staff_role AS ENUM ('admin', 'doctor', 'nurse', 'receptionist', 'technician');

-- Create user roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role staff_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Create patient assignments table (which medical staff can access which patients)
CREATE TABLE public.patient_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(staff_user_id, patient_id)
);

-- Enable RLS on new tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_assignments ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS staff_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_has_role(user_uuid UUID, required_role staff_role)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_uuid AND role = required_role
    );
$$;

CREATE OR REPLACE FUNCTION public.user_can_access_patient(user_uuid UUID, patient_uuid TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.patient_assignments 
        WHERE staff_user_id = user_uuid 
        AND patient_id = patient_uuid 
        AND (expires_at IS NULL OR expires_at > now())
    ) OR public.user_has_role(user_uuid, 'admin');
$$;

-- Create RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.user_has_role(auth.uid(), 'admin'))
WITH CHECK (public.user_has_role(auth.uid(), 'admin'));

-- Create RLS policies for patient_assignments table
CREATE POLICY "Users can view their own assignments"
ON public.patient_assignments
FOR SELECT
TO authenticated
USING (staff_user_id = auth.uid() OR public.user_has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and doctors can create assignments"
ON public.patient_assignments
FOR INSERT
TO authenticated
WITH CHECK (public.user_has_role(auth.uid(), 'admin') OR public.user_has_role(auth.uid(), 'doctor'));

CREATE POLICY "Admins and doctors can update assignments"
ON public.patient_assignments
FOR UPDATE
TO authenticated
USING (public.user_has_role(auth.uid(), 'admin') OR public.user_has_role(auth.uid(), 'doctor'))
WITH CHECK (public.user_has_role(auth.uid(), 'admin') OR public.user_has_role(auth.uid(), 'doctor'));

CREATE POLICY "Admins can delete assignments"
ON public.patient_assignments
FOR DELETE
TO authenticated
USING (public.user_has_role(auth.uid(), 'admin'));

-- Update triggers for timestamp management
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Drop old insecure policies
DROP POLICY IF EXISTS "Authenticated users can view patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can delete patients" ON public.patients;

DROP POLICY IF EXISTS "Authenticated users can view medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Authenticated users can insert medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Authenticated users can update medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Authenticated users can delete medical records" ON public.medical_records;

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

-- Update medical certificates policies to use patient assignments
DROP POLICY IF EXISTS "Allow authenticated users to view certificates" ON public.medical_certificates;
DROP POLICY IF EXISTS "Allow authenticated users to create certificates" ON public.medical_certificates;

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

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_patient_assignments_staff_user_id ON public.patient_assignments(staff_user_id);
CREATE INDEX idx_patient_assignments_patient_id ON public.patient_assignments(patient_id);
CREATE INDEX idx_patient_assignments_expires_at ON public.patient_assignments(expires_at) WHERE expires_at IS NOT NULL;