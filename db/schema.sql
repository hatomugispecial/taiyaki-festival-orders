CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS taiyaki_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  affiliation text,
  contact text,
  order_data jsonb NOT NULL,
  total_yen integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
