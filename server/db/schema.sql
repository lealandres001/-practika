-- ============================================================
-- PRACTIKA · Esquema PostgreSQL (producción)
-- Modelo entidad-relación de las Fases 1-3.
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(40) UNIQUE NOT NULL,
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  emoji       VARCHAR(8)
);

CREATE TABLE IF NOT EXISTS products (
  id            SERIAL PRIMARY KEY,
  category_id   INTEGER NOT NULL REFERENCES categories(id),
  name          VARCHAR(160) NOT NULL,
  description   TEXT,
  price_cop     INTEGER NOT NULL CHECK (price_cop >= 0),
  unit          VARCHAR(60),
  vacuum_packed BOOLEAN NOT NULL DEFAULT FALSE,
  emoji         VARCHAR(8)
);

CREATE TABLE IF NOT EXISTS plans (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(120) NOT NULL,
  description  TEXT,
  price_cop    INTEGER NOT NULL CHECK (price_cop >= 0),
  discount_pct INTEGER NOT NULL DEFAULT 0
);

-- Productos incluidos en cada plan (relación N:M)
CREATE TABLE IF NOT EXISTS plan_items (
  plan_id    INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  PRIMARY KEY (plan_id, product_id)
);

CREATE TABLE IF NOT EXISTS zones (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  lat  DOUBLE PRECISION NOT NULL,
  lng  DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(160) NOT NULL,
  email      VARCHAR(160) UNIQUE NOT NULL,
  address    TEXT,
  role       VARCHAR(20) NOT NULL DEFAULT 'cliente', -- cliente|operador|admin
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operators (
  id        SERIAL PRIMARY KEY,
  user_id   INTEGER REFERENCES users(id),
  name      VARCHAR(160) NOT NULL,
  zone_id   INTEGER REFERENCES zones(id),
  lat       DOUBLE PRECISION NOT NULL,
  lng       DOUBLE PRECISION NOT NULL,
  certified BOOLEAN NOT NULL DEFAULT FALSE,
  capacity  INTEGER NOT NULL DEFAULT 0,
  load      INTEGER NOT NULL DEFAULT 0,
  rating    NUMERIC(2,1) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id                  VARCHAR(20) PRIMARY KEY,           -- PR-####
  user_id             INTEGER REFERENCES users(id),
  user_name           VARCHAR(160) NOT NULL,
  customer_email      VARCHAR(160),
  customer_address    TEXT,
  type                VARCHAR(20) NOT NULL,              -- subscription|single
  subtotal            INTEGER NOT NULL,
  total               INTEGER NOT NULL,
  zone_id             INTEGER REFERENCES zones(id),
  operator_id         INTEGER REFERENCES operators(id),
  assignment_distance NUMERIC(6,2),
  trace_lot           VARCHAR(40),
  trace_weight        VARCHAR(40),
  trace_vacuum_ok     BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_day        VARCHAR(20),
  delivery_slot       VARCHAR(40),
  status              VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  payment_status      VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Líneas de cada pedido
CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   VARCHAR(20) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty        INTEGER NOT NULL CHECK (qty > 0)
);

CREATE TABLE IF NOT EXISTS courses (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  emoji       VARCHAR(8),
  description TEXT,
  pdf         VARCHAR(200),
  challenge   TEXT
);

CREATE TABLE IF NOT EXISTS course_lessons (
  id        SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  position  INTEGER NOT NULL,
  title     VARCHAR(200) NOT NULL
);

-- Historial agregado para la predicción de demanda (Fase 3)
CREATE TABLE IF NOT EXISTS sales_history (
  id          SERIAL PRIMARY KEY,
  week_label  VARCHAR(20) NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  qty         INTEGER NOT NULL DEFAULT 0
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_operator   ON orders(operator_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
