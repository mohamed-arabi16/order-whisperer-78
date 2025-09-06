-- CRITICAL SECURITY FIXES - Phase 1: Immediate Data Protection

-- 1. REMOVE DANGEROUS PUBLIC POLICIES FROM ORDERS AND ORDER_ITEMS
DROP POLICY IF EXISTS "Public orders are viewable by everyone." ON public.orders;
DROP POLICY IF EXISTS "Public order_items are viewable by everyone." ON public.order_items;

-- 2. CREATE SECURE RLS POLICIES FOR ORDERS
CREATE POLICY "Restaurant owners can view their orders" 
ON public.orders 
FOR SELECT 
USING (
  tenant_id IN (
    SELECT t.id FROM public.tenants t
    JOIN public.profiles p ON t.owner_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (is_super_admin());

-- 3. CREATE SECURE RLS POLICIES FOR ORDER_ITEMS  
CREATE POLICY "Restaurant owners can view their order items" 
ON public.order_items 
FOR SELECT 
USING (
  tenant_id IN (
    SELECT t.id FROM public.tenants t
    JOIN public.profiles p ON t.owner_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can view all order items" 
ON public.order_items 
FOR SELECT 
USING (is_super_admin());

-- 4. REMOVE DANGEROUS PUBLIC POLICY FROM FEEDBACK
DROP POLICY IF EXISTS "Public feedback is viewable by everyone." ON public.feedback;

-- 5. CREATE SECURE RLS POLICIES FOR FEEDBACK
CREATE POLICY "Restaurant owners can view their feedback" 
ON public.feedback 
FOR SELECT 
USING (
  tenant_id IN (
    SELECT t.id FROM public.tenants t
    JOIN public.profiles p ON t.owner_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can view all feedback" 
ON public.feedback 
FOR SELECT 
USING (is_super_admin());

-- 6. REMOVE DANGEROUS PUBLIC POLICY FROM MENU_VIEWS
DROP POLICY IF EXISTS "Public menu_views are viewable by everyone." ON public.menu_views;

-- 7. CREATE SECURE RLS POLICIES FOR MENU_VIEWS
CREATE POLICY "Restaurant owners can view their menu views" 
ON public.menu_views 
FOR SELECT 
USING (
  tenant_id IN (
    SELECT t.id FROM public.tenants t
    JOIN public.profiles p ON t.owner_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can view all menu views" 
ON public.menu_views 
FOR SELECT 
USING (is_super_admin());

-- 8. SECURE DATABASE FUNCTIONS - Add proper search_path settings
CREATE OR REPLACE FUNCTION public.get_total_menu_views(tenant_id_param uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  total_views BIGINT;
BEGIN
  SELECT COUNT(*)
  INTO total_views
  FROM menu_views
  WHERE tenant_id = tenant_id_param;

  RETURN total_views;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_menu_view(tenant_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO menu_views (tenant_id)
  VALUES (tenant_id_param);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_popular_menu_items(tenant_id_param uuid, limit_param integer)
RETURNS TABLE(menu_item_id uuid, name text, total_orders bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    oi.menu_item_id,
    mi.name,
    SUM(oi.quantity) AS total_orders
  FROM order_items oi
  JOIN menu_items mi ON oi.menu_item_id = mi.id
  WHERE oi.tenant_id = tenant_id_param
  GROUP BY oi.menu_item_id, mi.name
  ORDER BY total_orders DESC
  LIMIT limit_param;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_order_items(tenant_id_param uuid, items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    INSERT INTO order_items (tenant_id, menu_item_id, quantity)
    VALUES (tenant_id_param, (item->>'id')::UUID, (item->>'quantity')::INT);
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_sales_data(tenant_id_param uuid, time_period_param text)
RETURNS TABLE(date_trunc text, total_sales numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    to_char(date_trunc(time_period_param, o.created_at), 'YYYY-MM-DD') AS date_trunc,
    SUM(o.total_price) AS total_sales
  FROM orders o
  WHERE o.tenant_id = tenant_id_param
  GROUP BY date_trunc(time_period_param, o.created_at)
  ORDER BY date_trunc(time_period_param, o.created_at);
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_order(tenant_id_param uuid, total_price_param numeric, order_type_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO orders (tenant_id, total_price, order_type)
  VALUES (tenant_id_param, total_price_param, order_type_param);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_new_tenants_over_time(time_period_param text)
RETURNS TABLE(date_trunc text, new_tenants_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    to_char(date_trunc(time_period_param, t.created_at), 'YYYY-MM-DD') AS date_trunc,
    COUNT(t.id) AS new_tenants_count
  FROM tenants t
  GROUP BY date_trunc(time_period_param, t.created_at)
  ORDER BY date_trunc(time_period_param, t.created_at);
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_feedback(tenant_id_param uuid, rating_param integer, comment_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO feedback (tenant_id, rating, comment)
  VALUES (tenant_id_param, rating_param, comment_param);
END;
$function$;