CREATE OR REPLACE FUNCTION get_popular_menu_items(tenant_id_param UUID, limit_param INT)
RETURNS TABLE (
  menu_item_id UUID,
  name TEXT,
  total_orders BIGINT
) AS $$
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
$$ LANGUAGE plpgsql;
