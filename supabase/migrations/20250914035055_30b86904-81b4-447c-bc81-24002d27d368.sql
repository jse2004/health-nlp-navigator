-- Create appointments table for scheduling system
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id UUID,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  appointment_type TEXT NOT NULL DEFAULT 'consultation',
  status TEXT NOT NULL DEFAULT 'scheduled',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments
CREATE POLICY "Staff can view appointments for assigned patients" 
ON public.appointments 
FOR SELECT 
USING (user_can_access_patient(auth.uid(), patient_id) OR user_has_role(auth.uid(), 'admin'::staff_role));

CREATE POLICY "Staff can create appointments for assigned patients" 
ON public.appointments 
FOR INSERT 
WITH CHECK (user_can_access_patient(auth.uid(), patient_id) OR user_has_role(auth.uid(), 'admin'::staff_role));

CREATE POLICY "Staff can update appointments for assigned patients" 
ON public.appointments 
FOR UPDATE 
USING (user_can_access_patient(auth.uid(), patient_id) OR user_has_role(auth.uid(), 'admin'::staff_role))
WITH CHECK (user_can_access_patient(auth.uid(), patient_id) OR user_has_role(auth.uid(), 'admin'::staff_role));

CREATE POLICY "Admins and doctors can delete appointments" 
ON public.appointments 
FOR DELETE 
USING (user_has_role(auth.uid(), 'admin'::staff_role) OR user_has_role(auth.uid(), 'doctor'::staff_role));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create doctor schedules table for availability management
CREATE TABLE public.doctor_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, day_of_week, start_time)
);

-- Enable RLS on doctor schedules
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for doctor schedules
CREATE POLICY "Everyone can view doctor schedules" 
ON public.doctor_schedules 
FOR SELECT 
USING (true);

CREATE POLICY "Doctors can manage their own schedules" 
ON public.doctor_schedules 
FOR ALL 
USING (doctor_id = auth.uid() OR user_has_role(auth.uid(), 'admin'::staff_role))
WITH CHECK (doctor_id = auth.uid() OR user_has_role(auth.uid(), 'admin'::staff_role));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_doctor_schedules_updated_at
BEFORE UPDATE ON public.doctor_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create patient vitals table for enhanced patient data
CREATE TABLE public.patient_vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  medical_record_id TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,1),
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate INTEGER,
  temperature_celsius DECIMAL(4,1),
  oxygen_saturation INTEGER,
  blood_glucose DECIMAL(5,1),
  respiratory_rate INTEGER,
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on patient vitals
ALTER TABLE public.patient_vitals ENABLE ROW LEVEL SECURITY;

-- Create policies for patient vitals
CREATE POLICY "Staff can view vitals for assigned patients" 
ON public.patient_vitals 
FOR SELECT 
USING (user_can_access_patient(auth.uid(), patient_id) OR user_has_role(auth.uid(), 'admin'::staff_role));

CREATE POLICY "Staff can create vitals for assigned patients" 
ON public.patient_vitals 
FOR INSERT 
WITH CHECK (user_can_access_patient(auth.uid(), patient_id) OR user_has_role(auth.uid(), 'admin'::staff_role));

CREATE POLICY "Staff can update vitals for assigned patients" 
ON public.patient_vitals 
FOR UPDATE 
USING (user_can_access_patient(auth.uid(), patient_id) OR user_has_role(auth.uid(), 'admin'::staff_role))
WITH CHECK (user_can_access_patient(auth.uid(), patient_id) OR user_has_role(auth.uid(), 'admin'::staff_role));

CREATE POLICY "Admins and doctors can delete vitals" 
ON public.patient_vitals 
FOR DELETE 
USING (user_has_role(auth.uid(), 'admin'::staff_role) OR user_has_role(auth.uid(), 'doctor'::staff_role));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_patient_vitals_updated_at
BEFORE UPDATE ON public.patient_vitals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create patient allergies table
CREATE TABLE public.patient_allergies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  allergen TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'mild',
  reaction_description TEXT,
  onset_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on patient allergies
ALTER TABLE public.patient_allergies ENABLE ROW LEVEL SECURITY;

-- Create policies for patient allergies
CREATE POLICY "Staff can view allergies for assigned patients" 
ON public.patient_allergies 
FOR SELECT 
USING (user_can_access_patient(auth.uid(), patient_id) OR user_has_role(auth.uid(), 'admin'::staff_role));

CREATE POLICY "Staff can create allergies for assigned patients" 
ON public.patient_allergies 
FOR INSERT 
WITH CHECK (user_can_access_patient(auth.uid(), patient_id) OR user_has_role(auth.uid(), 'admin'::staff_role));

CREATE POLICY "Staff can update allergies for assigned patients" 
ON public.patient_allergies 
FOR UPDATE 
USING (user_can_access_patient(auth.uid(), patient_id) OR user_has_role(auth.uid(), 'admin'::staff_role))
WITH CHECK (user_can_access_patient(auth.uid(), patient_id) OR user_has_role(auth.uid(), 'admin'::staff_role));

CREATE POLICY "Admins and doctors can delete allergies" 
ON public.patient_allergies 
FOR DELETE 
USING (user_has_role(auth.uid(), 'admin'::staff_role) OR user_has_role(auth.uid(), 'doctor'::staff_role));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_patient_allergies_updated_at
BEFORE UPDATE ON public.patient_allergies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create medication prescriptions table
CREATE TABLE public.medication_prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  medical_record_id TEXT,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration_days INTEGER,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  instructions TEXT,
  prescribed_by UUID,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on medication prescriptions
ALTER TABLE public.medication_prescriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for medication prescriptions
CREATE POLICY "Staff can view prescriptions for assigned patients" 
ON public.medication_prescriptions 
FOR SELECT 
USING (user_can_access_patient(auth.uid(), patient_id) OR user_has_role(auth.uid(), 'admin'::staff_role));

CREATE POLICY "Doctors can create prescriptions for assigned patients" 
ON public.medication_prescriptions 
FOR INSERT 
WITH CHECK ((user_can_access_patient(auth.uid(), patient_id) AND user_has_role(auth.uid(), 'doctor'::staff_role)) OR user_has_role(auth.uid(), 'admin'::staff_role));

CREATE POLICY "Doctors can update prescriptions for assigned patients" 
ON public.medication_prescriptions 
FOR UPDATE 
USING ((user_can_access_patient(auth.uid(), patient_id) AND user_has_role(auth.uid(), 'doctor'::staff_role)) OR user_has_role(auth.uid(), 'admin'::staff_role))
WITH CHECK ((user_can_access_patient(auth.uid(), patient_id) AND user_has_role(auth.uid(), 'doctor'::staff_role)) OR user_has_role(auth.uid(), 'admin'::staff_role));

CREATE POLICY "Admins and doctors can delete prescriptions" 
ON public.medication_prescriptions 
FOR DELETE 
USING (user_has_role(auth.uid(), 'admin'::staff_role) OR user_has_role(auth.uid(), 'doctor'::staff_role));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_medication_prescriptions_updated_at
BEFORE UPDATE ON public.medication_prescriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();