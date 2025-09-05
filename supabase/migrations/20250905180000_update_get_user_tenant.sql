-- Update get_user_tenant function to be more robust
CREATE OR REPLACE FUNCTION public.get_user_tenant()
RETURNS UUID AS $$
DECLARE
  tenant_id UUID;
BEGIN
  SELECT t.id INTO tenant_id
  FROM public.tenants as t
  JOIN public.profiles as p ON t.owner_id = p.id
  WHERE p.user_id = auth.uid()
  LIMIT 1;
  RETURN tenant_id;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;
