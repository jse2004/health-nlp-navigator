-- Fix access issues by giving the current user admin role
-- This will allow them to access all patients and medical records

INSERT INTO user_roles (user_id, role) 
VALUES ('22920d8a-8093-4ecb-b420-ff86ff7b16b0', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;