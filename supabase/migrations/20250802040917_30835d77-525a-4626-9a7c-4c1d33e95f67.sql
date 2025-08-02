-- Add status column to medical_records table for deactivation functionality
ALTER TABLE public.medical_records 
ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

-- Add check constraint to ensure valid status values
ALTER TABLE public.medical_records 
ADD CONSTRAINT medical_records_status_check 
CHECK (status IN ('active', 'inactive'));

-- Create index for better performance when filtering by status
CREATE INDEX idx_medical_records_status ON public.medical_records(status);

-- Create index for better performance when filtering by patient_id and status
CREATE INDEX idx_medical_records_patient_status ON public.medical_records(patient_id, status);