-- Fix critical security vulnerability: Implement role-based access with patient assignments
-- Create enum for medical staff roles (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE public.staff_role AS ENUM ('admin', 'doctor', 'nurse', 'receptionist', 'technician');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user roles table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role staff_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Create patient assignments table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.patient_assignments (
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
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.user_has_role(auth.uid(), 'admin'))
WITH CHECK (public.user_has_role(auth.uid(), 'admin'));

-- Create RLS policies for patient_assignments table
DROP POLICY IF EXISTS "Users can view their own assignments" ON public.patient_assignments;
CREATE POLICY "Users can view their own assignments"
ON public.patient_assignments
FOR SELECT
TO authenticated
USING (staff_user_id = auth.uid() OR public.user_has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins and doctors can create assignments" ON public.patient_assignments;
CREATE POLICY "Admins and doctors can create assignments"
ON public.patient_assignments
FOR INSERT
TO authenticated
WITH CHECK (public.user_has_role(auth.uid(), 'admin') OR public.user_has_role(auth.uid(), 'doctor'));

DROP POLICY IF EXISTS "Admins and doctors can update assignments" ON public.patient_assignments;
CREATE POLICY "Admins and doctors can update assignments"
ON public.patient_assignments
FOR UPDATE
TO authenticated
USING (public.user_has_role(auth.uid(), 'admin') OR public.user_has_role(auth.uid(), 'doctor'))
WITH CHECK (public.user_has_role(auth.uid(), 'admin') OR public.user_has_role(auth.uid(), 'doctor'));

DROP POLICY IF EXISTS "Admins can delete assignments" ON public.patient_assignments;
CREATE POLICY "Admins can delete assignments"
ON public.patient_assignments
FOR DELETE
TO authenticated
USING (public.user_has_role(auth.uid(), 'admin'));

-- Update triggers for timestamp management
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();