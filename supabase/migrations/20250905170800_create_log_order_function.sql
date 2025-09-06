CREATE OR REPLACE FUNCTION log_order(tenant_id_param UUID, total_price_param DECIMAL, order_type_param TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO orders (tenant_id, total_price, order_type)
  VALUES (tenant_id_param, total_price_param, order_type_param);
END;
$$ LANGUAGE plpgsql;
