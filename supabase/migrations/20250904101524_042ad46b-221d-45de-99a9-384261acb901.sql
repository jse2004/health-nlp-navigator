-- Add college_department enum type
CREATE TYPE public.college_department AS ENUM (
    'CED', -- College of Education
    'CCS', -- College of Computing Science
    'CCJ', -- College of Criminal Justice
    'CHS', -- College of Health Science
    'CAS', -- College of Arts and Science
    'CBA'  -- College of Business Administration
);

-- Add college_department column to patients table
ALTER TABLE public.patients 
ADD COLUMN college_department college_department;

-- Add index for better performance on department queries
CREATE INDEX idx_patients_college_department ON public.patients(college_department);

-- Add index for medical_records date for monthly analytics
CREATE INDEX idx_medical_records_date ON public.medical_records(date);

-- Create view for monthly visit analytics by department
CREATE OR REPLACE VIEW public.monthly_visit_analytics AS
SELECT 
    DATE_TRUNC('month', mr.date) as month,
    p.college_department,
    COUNT(*) as total_visits,
    COUNT(DISTINCT p.id) as unique_patients,
    COUNT(CASE WHEN mr.severity >= 7 THEN 1 END) as critical_cases,
    COUNT(CASE WHEN mr.severity BETWEEN 4 AND 6 THEN 1 END) as moderate_cases,
    COUNT(CASE WHEN mr.severity <= 3 THEN 1 END) as mild_cases
FROM medical_records mr
JOIN patients p ON mr.patient_id = p.id
WHERE mr.date IS NOT NULL
GROUP BY DATE_TRUNC('month', mr.date), p.college_department
ORDER BY month DESC, p.college_department;

-- Create view for case analytics by diagnosis and department
CREATE OR REPLACE VIEW public.case_analytics_by_department AS
SELECT 
    DATE_TRUNC('month', mr.date) as month,
    p.college_department,
    mr.diagnosis,
    COUNT(*) as case_count
FROM medical_records mr
JOIN patients p ON mr.patient_id = p.id
WHERE mr.date IS NOT NULL AND mr.diagnosis IS NOT NULL
GROUP BY DATE_TRUNC('month', mr.date), p.college_department, mr.diagnosis
ORDER BY month DESC, p.college_department, case_count DESC;