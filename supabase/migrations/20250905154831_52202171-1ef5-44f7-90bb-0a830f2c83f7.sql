-- Create test users for easy authentication testing
-- Super Admin user: admin@test.com / 123456
-- Restaurant Owner user: owner@test.com / 123456

-- These will be created via the Supabase Auth interface
-- But we need to ensure proper profiles and roles are set up

-- First, let's ensure we have a test restaurant for the owner
INSERT INTO public.tenants (name, slug, phone_number, owner_email, created_at, updated_at)
VALUES (
  'مطعم التجربة',
  'test-restaurant', 
  '+96171123456',
  'owner@test.com',
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- Create user roles for test users if they don't exist
-- Note: The actual user IDs will be created when users sign up
-- This is just a placeholder to demonstrate the structure