-- Fix admin role assignment for correct user
-- Remove incorrect user and assign to correct user from auth logs
DELETE FROM user_roles WHERE user_id = '22920d8a-8093-4ecb-b420-ff86ff7b16b0';

-- Assign admin role to the actual authenticated user
INSERT INTO user_roles (user_id, role) 
VALUES ('565f8b67-74ac-4583-b2e2-628283862ba3', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;