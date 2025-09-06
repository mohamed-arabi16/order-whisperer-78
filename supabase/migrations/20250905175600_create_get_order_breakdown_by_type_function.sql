CREATE OR REPLACE FUNCTION get_order_breakdown_by_type(tenant_id_param UUID, start_date_param TIMESTAMPTZ, end_date_param TIMESTAMPTZ)
RETURNS TABLE (
  order_type TEXT,
  order_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.order_type,
    COUNT(o.id) AS order_count
  FROM orders o
  WHERE o.tenant_id = tenant_id_param AND o.created_at >= start_date_param AND o.created_at <= end_date_param
  GROUP BY o.order_type;
END;
$$ LANGUAGE plpgsql;
