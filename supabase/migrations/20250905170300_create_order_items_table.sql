CREATE TABLE order_items (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public order_items are viewable by everyone."
  ON public.order_items FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own order_items."
  ON public.order_items FOR INSERT
  WITH CHECK ( true );
