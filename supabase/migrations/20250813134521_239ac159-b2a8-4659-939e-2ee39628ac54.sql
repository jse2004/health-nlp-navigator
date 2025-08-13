-- Fix critical security vulnerability: Remove public access to medical_records
-- Drop the overly permissive policies that allow public access
DROP POLICY IF EXISTS "Allow full access to all users for now" ON public.medical_records;
DROP POLICY IF EXISTS "Allow public read access for now" ON public.medical_records;

-- Ensure we have proper policies for authenticated users only
DROP POLICY IF EXISTS "Only authenticated users can manage medical records" ON public.medical_records;

-- Create secure policies that only allow authenticated users
CREATE POLICY "Authenticated users can view medical records"
ON public.medical_records
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert medical records"
ON public.medical_records
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update medical records"
ON public.medical_records
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete medical records"
ON public.medical_records
FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- Also fix the patients table while we're at it
DROP POLICY IF EXISTS "Allow full access to all users for now" ON public.patients;
DROP POLICY IF EXISTS "Allow public read access for now" ON public.patients;

-- Ensure patients table also requires authentication
CREATE POLICY "Authenticated users can view patients"
ON public.patients
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update patients"
ON public.patients
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete patients"
ON public.patients
FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');