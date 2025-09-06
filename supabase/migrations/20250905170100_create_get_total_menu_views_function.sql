CREATE OR REPLACE FUNCTION get_total_menu_views(tenant_id_param UUID)
RETURNS BIGINT AS $$
DECLARE
  total_views BIGINT;
BEGIN
  SELECT COUNT(*)
  INTO total_views
  FROM menu_views
  WHERE tenant_id = tenant_id_param;

  RETURN total_views;
END;
$$ LANGUAGE plpgsql;
