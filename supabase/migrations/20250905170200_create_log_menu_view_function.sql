CREATE OR REPLACE FUNCTION log_menu_view(tenant_id_param UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO menu_views (tenant_id)
  VALUES (tenant_id_param);
END;
$$ LANGUAGE plpgsql;
