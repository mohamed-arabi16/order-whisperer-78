-- Fix remaining functions that need search_path security setting

CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS profiles
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT * FROM public.profiles WHERE user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_tenant()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT t.id FROM public.tenants t
  JOIN public.profiles p ON t.owner_id = p.id
  WHERE p.user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_menu_data(p_slug text)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_tenant RECORD;
  v_categories JSON;
  v_menu_items JSON;
BEGIN
  -- Get the tenant details. IMPORTANT: We are using the "anon" role's RLS here.
  -- The RLS policy "Public can view active tenants" will be applied.
  SELECT * INTO v_tenant
  FROM public.tenants
  WHERE slug = p_slug;

  -- If no tenant is found (or tenant is not active), return null.
  IF v_tenant IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get categories for the tenant - Fixed ORDER BY syntax
  SELECT json_agg(
    json_build_object(
      'id', mc.id,
      'name', mc.name,
      'display_order', mc.display_order
    ) ORDER BY mc.display_order
  ) INTO v_categories
  FROM public.menu_categories mc
  WHERE mc.tenant_id = v_tenant.id AND mc.is_active = true;

  -- Get menu items for the tenant - Fixed ORDER BY syntax  
  SELECT json_agg(
    json_build_object(
      'id', mi.id,
      'name', mi.name,
      'description', mi.description,
      'price', mi.price,
      'image_url', mi.image_url,
      'category_id', mi.category_id,
      'is_available', mi.is_available
    ) ORDER BY mi.display_order
  ) INTO v_menu_items
  FROM public.menu_items mi
  WHERE mi.tenant_id = v_tenant.id;

  -- Combine all data into a single JSON object
  RETURN json_build_object(
    'tenant', row_to_json(v_tenant),
    'categories', COALESCE(v_categories, '[]'::json),
    'menu_items', COALESCE(v_menu_items, '[]'::json)
  );
END;
$function$;