-- Add missing columns to tenants table for complete restaurant information

-- Add description column for restaurant descriptions
ALTER TABLE public.tenants 
ADD COLUMN description TEXT;

-- Add logo_position column for branding customization
ALTER TABLE public.tenants 
ADD COLUMN logo_position TEXT DEFAULT 'center';

-- Add constraint to ensure logo_position has valid values
ALTER TABLE public.tenants 
ADD CONSTRAINT logo_position_check CHECK (logo_position IN ('left', 'center', 'right'));

-- Add social_media_links column as JSONB for flexible social media storage
ALTER TABLE public.tenants 
ADD COLUMN social_media_links JSONB DEFAULT '{}'::jsonb;