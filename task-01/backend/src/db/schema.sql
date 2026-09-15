

CREATE TABLE IF NOT EXISTS products (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  price          NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  total_stock    INTEGER NOT NULL CHECK (total_stock >= 0),
  reserved_stock INTEGER NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reserved_not_over_total CHECK (reserved_stock <= total_stock)
);

CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  idempotency_key TEXT UNIQUE, -- client-supplied; a retried checkout returns the same order instead of creating a second one
  status          TEXT NOT NULL CHECK (status IN ('reserved', 'paid', 'failed', 'expired', 'cancelled')),
  total_amount    NUMERIC(10, 2) NOT NULL DEFAULT 0,
  reserved_until  TIMESTAMPTZ,          -- null once the order leaves 'reserved'
  payment_outcome TEXT,                 -- 'success' | 'failure' | 'timeout', set once a payment attempt resolves
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL -- captured at order time, independent of later price changes
);

CREATE INDEX IF NOT EXISTS idx_orders_status_reserved_until ON orders (status, reserved_until);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);
