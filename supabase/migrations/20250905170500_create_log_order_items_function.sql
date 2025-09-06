CREATE OR REPLACE FUNCTION log_order_items(tenant_id_param UUID, items JSONB)
RETURNS VOID AS $$
DECLARE
  item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    INSERT INTO order_items (tenant_id, menu_item_id, quantity)
    VALUES (tenant_id_param, (item->>'id')::UUID, (item->>'quantity')::INT);
  END LOOP;
END;
$$ LANGUAGE plpgsql;
