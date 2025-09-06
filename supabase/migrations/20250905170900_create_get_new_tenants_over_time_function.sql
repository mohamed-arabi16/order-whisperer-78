CREATE OR REPLACE FUNCTION get_new_tenants_over_time(time_period_param TEXT)
RETURNS TABLE (
  date_trunc TEXT,
  new_tenants_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(date_trunc(time_period_param, t.created_at), 'YYYY-MM-DD') AS date_trunc,
    COUNT(t.id) AS new_tenants_count
  FROM tenants t
  GROUP BY date_trunc(time_period_param, t.created_at)
  ORDER BY date_trunc(time_period_param, t.created_at);
END;
$$ LANGUAGE plpgsql;
