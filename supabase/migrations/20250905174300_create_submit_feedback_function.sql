CREATE OR REPLACE FUNCTION submit_feedback(tenant_id_param UUID, rating_param INT, comment_param TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO feedback (tenant_id, rating, comment)
  VALUES (tenant_id_param, rating_param, comment_param);
END;
$$ LANGUAGE plpgsql;
