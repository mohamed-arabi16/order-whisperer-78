CREATE OR REPLACE FUNCTION get_sales_data(tenant_id_param UUID, time_period_param TEXT)
RETURNS TABLE (
  date_trunc TEXT,
  total_sales DECIMAL
) AS $$
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
$$ LANGUAGE plpgsql;
