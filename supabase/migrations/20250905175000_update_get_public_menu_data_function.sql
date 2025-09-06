CREATE OR REPLACE FUNCTION get_public_menu_data(p_slug TEXT)
RETURNS JSONB AS $$
DECLARE
  v_tenant RECORD;
  v_categories JSONB;
  v_menu_items JSONB;
BEGIN
  -- Find the tenant by slug
  SELECT id, name, slug, phone_number, logo_url, cover_photo_url, primary_color, logo_position, social_media_links
  INTO v_tenant
  FROM public.tenants
  WHERE slug = p_slug AND is_active = TRUE;

  -- If no tenant found, return null
  IF v_tenant.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get all active categories for the tenant, ordered by display_order
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'display_order', display_order
    ) ORDER BY display_order
  )
  INTO v_categories
  FROM public.menu_categories
  WHERE tenant_id = v_tenant.id AND is_active = TRUE;

  -- Get all available menu items for the tenant, ordered by display_order
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'description', description,
      'price', price,
      'image_url', image_url,
      'category_id', category_id,
      'is_available', is_available,
      'dietary_preferences', dietary_preferences
    ) ORDER BY display_order
  )
  INTO v_menu_items
  FROM public.menu_items
  WHERE tenant_id = v_tenant.id AND is_available = TRUE;

  -- Return the combined data as a single JSONB object
  RETURN jsonb_build_object(
    'tenant', to_jsonb(v_tenant),
    'categories', COALESCE(v_categories, '[]'::jsonb),
    'menu_items', COALESCE(v_menu_items, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql;
