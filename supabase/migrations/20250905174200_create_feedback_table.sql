CREATE TABLE feedback (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public feedback is viewable by everyone."
  ON public.feedback FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own feedback."
  ON public.feedback FOR INSERT
  WITH CHECK ( true );
