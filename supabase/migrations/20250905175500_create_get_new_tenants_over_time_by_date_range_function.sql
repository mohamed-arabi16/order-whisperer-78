CREATE OR REPLACE FUNCTION get_new_tenants_over_time_by_date_range(start_date_param TIMESTAMPTZ, end_date_param TIMESTAMPTZ)
RETURNS TABLE (
  date_trunc TEXT,
  new_tenants_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(date_trunc('day', t.created_at), 'YYYY-MM-DD') AS date_trunc,
    COUNT(t.id) AS new_tenants_count
  FROM tenants t
  WHERE t.created_at >= start_date_param AND t.created_at <= end_date_param
  GROUP BY date_trunc('day', t.created_at)
  ORDER BY date_trunc('day', t.created_at);
END;
$$ LANGUAGE plpgsql;
