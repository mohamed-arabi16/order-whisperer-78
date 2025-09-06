CREATE TABLE orders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  total_price DECIMAL(10, 2) NOT NULL,
  order_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public orders are viewable by everyone."
  ON public.orders FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own orders."
  ON public.orders FOR INSERT
  WITH CHECK ( true );
