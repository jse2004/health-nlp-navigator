-- Fix security issues by recreating views without SECURITY DEFINER
-- Drop existing views first
DROP VIEW IF EXISTS public.monthly_visit_analytics;
DROP VIEW IF EXISTS public.case_analytics_by_department;

-- Recreate views without SECURITY DEFINER (using default SECURITY INVOKER)
CREATE VIEW public.monthly_visit_analytics AS
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

CREATE VIEW public.case_analytics_by_department AS
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