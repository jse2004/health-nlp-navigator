-- Create clearance records table
CREATE TABLE public.clearance_records (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    medical_record_id text REFERENCES public.medical_records(id) ON DELETE CASCADE,
    patient_id text NOT NULL,
    patient_name text NOT NULL,
    person_type text NOT NULL CHECK (person_type IN ('professor', 'employee', 'guest')),
    -- Common fields for all person types
    full_name text NOT NULL,
    age integer NOT NULL,
    gender text NOT NULL,
    -- Professor/Employee specific fields
    position text,
    college_department college_department,
    faculty text,
    -- Clearance status
    clearance_status text NOT NULL DEFAULT 'pending' CHECK (clearance_status IN ('pending', 'approved', 'denied')),
    clearance_reason text,
    approved_by uuid,
    approved_at timestamp with time zone,
    valid_until date,
    -- Metadata
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clearance_records ENABLE ROW LEVEL SECURITY;

-- Create policies for clearance_records
CREATE POLICY "Staff can view clearance records for assigned patients"
    ON public.clearance_records FOR SELECT
    USING (user_can_access_patient(auth.uid(), patient_id) OR user_has_role(auth.uid(), 'admin'::staff_role));

CREATE POLICY "Staff can create clearance records for assigned patients"
    ON public.clearance_records FOR INSERT
    WITH CHECK (user_can_access_patient(auth.uid(), patient_id) OR user_has_role(auth.uid(), 'admin'::staff_role));

CREATE POLICY "Doctors and admins can update clearance records"
    ON public.clearance_records FOR UPDATE
    USING ((user_can_access_patient(auth.uid(), patient_id) AND user_has_role(auth.uid(), 'doctor'::staff_role)) OR user_has_role(auth.uid(), 'admin'::staff_role))
    WITH CHECK ((user_can_access_patient(auth.uid(), patient_id) AND user_has_role(auth.uid(), 'doctor'::staff_role)) OR user_has_role(auth.uid(), 'admin'::staff_role));

CREATE POLICY "Admins and doctors can delete clearance records"
    ON public.clearance_records FOR DELETE
    USING (user_has_role(auth.uid(), 'admin'::staff_role) OR user_has_role(auth.uid(), 'doctor'::staff_role));

-- Add trigger for updating timestamps
CREATE TRIGGER update_clearance_records_updated_at
    BEFORE UPDATE ON public.clearance_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update medical_records table to include person_type and related fields
ALTER TABLE public.medical_records 
ADD COLUMN person_type text CHECK (person_type IN ('professor', 'employee', 'guest')),
ADD COLUMN full_name text,
ADD COLUMN age integer,
ADD COLUMN gender text,
ADD COLUMN position text,
ADD COLUMN faculty text;

-- Create clearance analytics view
CREATE OR REPLACE VIEW public.clearance_analytics_by_department AS
SELECT 
    college_department,
    person_type,
    clearance_status,
    COUNT(*) as clearance_count,
    DATE_TRUNC('month', created_at) as month
FROM public.clearance_records
WHERE college_department IS NOT NULL
GROUP BY college_department, person_type, clearance_status, DATE_TRUNC('month', created_at)
ORDER BY month DESC, college_department, person_type;