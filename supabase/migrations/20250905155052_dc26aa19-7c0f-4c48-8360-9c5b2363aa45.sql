-- Insert test user data for admin and restaurant owner
-- We'll create the user profiles and roles manually

-- Insert test super admin profile
INSERT INTO public.profiles (
  user_id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Placeholder UUID for admin user
  'admin@test.com',
  'Super Admin',
  'super_admin',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Insert test restaurant owner profile
INSERT INTO public.profiles (
  user_id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002', -- Placeholder UUID for owner user
  'owner@test.com',
  'Restaurant Owner',
  'restaurant_owner', 
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Create a test restaurant for the owner
INSERT INTO public.tenants (
  name,
  slug,
  phone_number,
  owner_id,
  created_at,
  updated_at
) VALUES (
  'مطعم التجربة',
  'test-restaurant',
  '+96171123456',
  (SELECT id FROM public.profiles WHERE email = 'owner@test.com' LIMIT 1),
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;