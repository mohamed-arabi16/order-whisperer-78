CREATE TABLE menu_views (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET
);

ALTER TABLE menu_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public menu_views are viewable by everyone."
  ON public.menu_views FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own menu_views."
  ON public.menu_views FOR INSERT
  WITH CHECK ( true );
