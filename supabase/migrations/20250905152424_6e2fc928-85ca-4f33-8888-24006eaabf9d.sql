-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('super_admin', 'restaurant_owner');

-- Create enum for subscription plans
CREATE TYPE public.subscription_plan AS ENUM ('basic', 'premium', 'enterprise');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'restaurant_owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tenants table (restaurant accounts)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_plan public.subscription_plan NOT NULL DEFAULT 'basic',
  phone_number TEXT,
  address TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2563eb',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create menu categories table
CREATE TABLE public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create menu items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- Price in cents/smallest currency unit
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Create function to get current user profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS public.profiles AS $$
  SELECT * FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to get user's tenant
CREATE OR REPLACE FUNCTION public.get_user_tenant()
RETURNS UUID AS $$
  SELECT t.id FROM public.tenants t
  JOIN public.profiles p ON t.owner_id = p.id
  WHERE p.user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Super admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.is_super_admin());

-- RLS Policies for tenants
CREATE POLICY "Super admins can view all tenants" ON public.tenants
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Restaurant owners can view their own tenant" ON public.tenants
  FOR SELECT USING (owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Super admins can insert tenants" ON public.tenants
  FOR INSERT WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can update tenants" ON public.tenants
  FOR UPDATE USING (public.is_super_admin());

CREATE POLICY "Restaurant owners can update their own tenant" ON public.tenants
  FOR UPDATE USING (owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for menu_categories
CREATE POLICY "Super admins can view all categories" ON public.menu_categories
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Restaurant owners can view their tenant's categories" ON public.menu_categories
  FOR SELECT USING (tenant_id = public.get_user_tenant());

CREATE POLICY "Public can view active categories" ON public.menu_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Restaurant owners can manage their categories" ON public.menu_categories
  FOR ALL USING (tenant_id = public.get_user_tenant());

-- RLS Policies for menu_items
CREATE POLICY "Super admins can view all items" ON public.menu_items
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Restaurant owners can view their tenant's items" ON public.menu_items
  FOR SELECT USING (tenant_id = public.get_user_tenant());

CREATE POLICY "Public can view available items" ON public.menu_items
  FOR SELECT USING (is_available = true);

CREATE POLICY "Restaurant owners can manage their items" ON public.menu_items
  FOR ALL USING (tenant_id = public.get_user_tenant());

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_tenants
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_categories
  BEFORE UPDATE ON public.menu_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_items
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'restaurant_owner')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('menu-images', 'menu-images', true);

-- Create storage policies
CREATE POLICY "Anyone can view menu images" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "Restaurant owners can upload menu images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'menu-images' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Restaurant owners can update their menu images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'menu-images' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Restaurant owners can delete their menu images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'menu-images' 
    AND auth.uid() IS NOT NULL
  );