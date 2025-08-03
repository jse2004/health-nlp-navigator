-- Create medical certificates table
CREATE TABLE public.medical_certificates (
  id TEXT NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medical_record_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until DATE,
  certificate_type TEXT NOT NULL DEFAULT 'clinic_visit',
  reason TEXT NOT NULL,
  recommendations TEXT,
  doctor_name TEXT DEFAULT 'Dr. Medical Officer',
  certificate_number TEXT NOT NULL DEFAULT CONCAT('CERT-', TO_CHAR(NOW(), 'YYYYMMDD'), '-', LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 8, '0')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.medical_certificates ENABLE ROW LEVEL SECURITY;

-- Create policies for medical certificates
CREATE POLICY "Allow authenticated users to view certificates" 
ON public.medical_certificates 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Allow authenticated users to create certificates" 
ON public.medical_certificates 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

-- Create indexes for better performance
CREATE INDEX idx_medical_certificates_record_id ON public.medical_certificates(medical_record_id);
CREATE INDEX idx_medical_certificates_patient ON public.medical_certificates(patient_name);
CREATE INDEX idx_medical_certificates_date ON public.medical_certificates(issue_date);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_medical_certificates_updated_at
BEFORE UPDATE ON public.medical_certificates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();