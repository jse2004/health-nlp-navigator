-- Fix function security by setting search_path
-- Update existing functions to be more secure

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS staff_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
    SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_role(user_uuid uuid, required_role staff_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_uuid AND role = required_role
    );
$function$;

CREATE OR REPLACE FUNCTION public.user_can_access_patient(user_uuid uuid, patient_uuid text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.patient_assignments 
        WHERE staff_user_id = user_uuid 
        AND patient_id = patient_uuid 
        AND (expires_at IS NULL OR expires_at > now())
    ) OR public.user_has_role(user_uuid, 'admin');
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;