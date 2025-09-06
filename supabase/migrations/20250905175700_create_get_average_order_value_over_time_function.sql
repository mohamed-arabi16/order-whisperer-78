CREATE OR REPLACE FUNCTION get_average_order_value_over_time(tenant_id_param UUID, start_date_param TIMESTAMPTZ, end_date_param TIMESTAMPTZ)
RETURNS TABLE (
  date_trunc TEXT,
  avg_order_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(date_trunc('day', o.created_at), 'YYYY-MM-DD') AS date_trunc,
    AVG(o.total_price) AS avg_order_value
  FROM orders o
  WHERE o.tenant_id = tenant_id_param AND o.created_at >= start_date_param AND o.created_at <= end_date_param
  GROUP BY date_trunc('day', o.created_at)
  ORDER BY date_trunc('day', o.created_at);
END;
$$ LANGUAGE plpgsql;
