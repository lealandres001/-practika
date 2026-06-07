-- ============================================================================
-- PRACTIKA — Esquema de base de datos PostgreSQL 16
-- FoodTech de economía colaborativa para alistamiento culinario.
-- Versión 0.1
--
-- Convenciones:
--   * PK con UUID (gen_random_uuid()).
--   * Montos en enteros (centavos COP) -> columnas *_cents.
--   * Borrado lógico (is_active) en catálogo.
--   * timestamptz en UTC para todo registro temporal.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";     -- emails case-insensitive

-- ----------------------------------------------------------------------------
-- TIPOS ENUMERADOS
-- ----------------------------------------------------------------------------
CREATE TYPE user_role          AS ENUM ('cliente', 'practiker', 'admin');
CREATE TYPE auth_provider      AS ENUM ('email', 'google', 'apple', 'facebook');
CREATE TYPE practiker_status   AS ENUM ('pendiente_validacion', 'active', 'inactive', 'suspendido');
CREATE TYPE order_status       AS ENUM ('pendiente', 'asignado', 'preparando', 'empaque_listo', 'en_ruta', 'entregado', 'cancelado');
CREATE TYPE subscription_status AS ENUM ('activa', 'pausada', 'cancelada', 'vencida');
CREATE TYPE delivery_frequency AS ENUM ('semanal', 'quincenal', 'mensual');
CREATE TYPE payment_status     AS ENUM ('pendiente', 'aprobado', 'rechazado', 'reembolsado', 'parcial');
CREATE TYPE payment_gateway    AS ENUM ('stripe', 'mercadopago', 'epayco', 'bold', 'paypal');
CREATE TYPE notification_channel AS ENUM ('push', 'sms', 'whatsapp', 'email');

-- ----------------------------------------------------------------------------
-- USUARIOS Y ACCESO
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           CITEXT UNIQUE NOT NULL,
    phone           VARCHAR(30),
    full_name       VARCHAR(160) NOT NULL,
    password_hash   TEXT,                       -- NULL si solo usa OAuth
    auth_provider   auth_provider NOT NULL DEFAULT 'email',
    provider_user_id VARCHAR(255),              -- id externo del proveedor OAuth
    role            user_role NOT NULL DEFAULT 'cliente',
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE addresses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label           VARCHAR(60),                 -- "Casa", "Oficina"
    line1           VARCHAR(255) NOT NULL,
    line2           VARCHAR(255),
    city            VARCHAR(120) NOT NULL,
    state           VARCHAR(120),
    postal_code     VARCHAR(20),
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_addresses_user ON addresses(user_id);
-- Solo una dirección principal por usuario
CREATE UNIQUE INDEX uq_primary_address ON addresses(user_id) WHERE is_primary;

CREATE TABLE payment_methods (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gateway         payment_gateway NOT NULL,
    gateway_token   VARCHAR(255) NOT NULL,       -- token de la pasarela (NUNCA el PAN)
    brand           VARCHAR(40),                 -- visa, mastercard...
    last4           VARCHAR(4),
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);

-- Tokens de refresco para JWT rotatorio
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ----------------------------------------------------------------------------
-- PERFIL DE OPERADOR CULINARIO (PRACTIKER)
-- ----------------------------------------------------------------------------
CREATE TABLE practiker_profiles (
    user_id              UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    status               practiker_status NOT NULL DEFAULT 'pendiente_validacion',
    rating               NUMERIC(3,2) NOT NULL DEFAULT 5.00 CHECK (rating BETWEEN 0 AND 5),
    location_name        VARCHAR(160),
    latitude             DOUBLE PRECISION,
    longitude            DOUBLE PRECISION,
    completed_orders     INTEGER NOT NULL DEFAULT 0,
    current_workload     INTEGER NOT NULL DEFAULT 0,
    max_workload         INTEGER NOT NULL DEFAULT 5,
    validated_by         UUID REFERENCES users(id),
    validated_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE practiker_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practiker_id    UUID NOT NULL REFERENCES practiker_profiles(user_id) ON DELETE CASCADE,
    doc_type        VARCHAR(80) NOT NULL,        -- cedula, certificado_manipulacion, etc.
    file_url        TEXT NOT NULL,               -- S3
    verified        BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_practiker_docs ON practiker_documents(practiker_id);

CREATE TABLE practiker_inventory (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practiker_id    UUID NOT NULL REFERENCES practiker_profiles(user_id) ON DELETE CASCADE,
    ingredient_name VARCHAR(160) NOT NULL,
    stock_percent   SMALLINT NOT NULL DEFAULT 100 CHECK (stock_percent BETWEEN 0 AND 100),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_practiker_inventory ON practiker_inventory(practiker_id);

-- ----------------------------------------------------------------------------
-- CATÁLOGO
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(80) UNIQUE NOT NULL,  -- Bases, Salsas, Vegetales, Proteínas
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE products (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku              VARCHAR(40) UNIQUE,          -- legible (prod-ajo-01)
    category_id      UUID NOT NULL REFERENCES categories(id),
    name             VARCHAR(200) NOT NULL,
    description      TEXT,
    ingredients_text TEXT,
    nutrition        JSONB,                       -- info nutricional flexible
    price_cents      INTEGER NOT NULL CHECK (price_cents >= 0),
    unit             VARCHAR(80),                 -- "Tarro al Vacío"
    weight_grams     INTEGER,
    image_url        TEXT,
    vacuum_sealed    BOOLEAN NOT NULL DEFAULT TRUE,
    shelf_life_days  INTEGER,
    suggested_stock  INTEGER NOT NULL DEFAULT 0,
    available        BOOLEAN NOT NULL DEFAULT TRUE,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active, available);

-- ----------------------------------------------------------------------------
-- RECETAS ESTANDARIZADAS (PRODUCCIÓN GUIADA + HACCP)
-- ----------------------------------------------------------------------------
CREATE TABLE recipes (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id               UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    chef_name                VARCHAR(160),
    standard_batch_size      VARCHAR(120),
    prep_time_minutes        INTEGER,
    -- especificación de vacío
    vacuum_pressure_percent  NUMERIC(4,1),
    sealing_time_seconds     NUMERIC(4,1),
    sealing_temp_celsius     NUMERIC(5,1),
    packaging_type           VARCHAR(255),
    storage_temp_celsius     NUMERIC(4,1),
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_recipe_product ON recipes(product_id);

CREATE TABLE recipe_steps (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id           UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    step_number         SMALLINT NOT NULL,
    instruction         TEXT NOT NULL,
    duration_minutes    INTEGER,
    is_critical_point   BOOLEAN NOT NULL DEFAULT FALSE,  -- PCC
    UNIQUE (recipe_id, step_number)
);

CREATE TABLE recipe_ingredients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id       UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    name            VARCHAR(160) NOT NULL,
    quantity        NUMERIC(10,3) NOT NULL,
    unit            VARCHAR(20) NOT NULL
);

-- ----------------------------------------------------------------------------
-- SUSCRIPCIONES
-- ----------------------------------------------------------------------------
CREATE TABLE subscription_plans (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku                 VARCHAR(40) UNIQUE,
    name                VARCHAR(160) NOT NULL,
    description         TEXT,
    price_monthly_cents INTEGER NOT NULL CHECK (price_monthly_cents >= 0),
    frequency           delivery_frequency NOT NULL,
    deliveries_per_month SMALLINT NOT NULL,
    categories_included JSONB,        -- ["Bases","Salsas"]
    features            JSONB,        -- lista de beneficios
    is_active           BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE subscriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id             UUID NOT NULL REFERENCES subscription_plans(id),
    status              subscription_status NOT NULL DEFAULT 'activa',
    auto_renew          BOOLEAN NOT NULL DEFAULT TRUE,
    current_period_start DATE NOT NULL,
    current_period_end   DATE NOT NULL,
    paused_at           TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ----------------------------------------------------------------------------
-- PEDIDOS
-- ----------------------------------------------------------------------------
CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code          VARCHAR(20) UNIQUE,        -- legible (ord-101)
    client_id           UUID NOT NULL REFERENCES users(id),
    subscription_id     UUID REFERENCES subscriptions(id),
    operator_id         UUID REFERENCES practiker_profiles(user_id),
    status              order_status NOT NULL DEFAULT 'pendiente',
    total_cents         INTEGER NOT NULL CHECK (total_cents >= 0),
    -- snapshot de entrega
    delivery_address    TEXT,
    delivery_latitude   DOUBLE PRECISION,
    delivery_longitude  DOUBLE PRECISION,
    scheduled_date      DATE,
    delivery_window     VARCHAR(40),               -- "08:00 - 12:00"
    is_scheduled        BOOLEAN NOT NULL DEFAULT FALSE,
    version             INTEGER NOT NULL DEFAULT 0, -- bloqueo optimista para claim
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_operator ON orders(operator_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_scheduled ON orders(scheduled_date);

CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id),
    product_name    VARCHAR(200) NOT NULL,     -- snapshot (el producto puede cambiar)
    quantity        SMALLINT NOT NULL CHECK (quantity > 0),
    weight_grams    INTEGER,
    unit_price_cents INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Trazabilidad HACCP: registro inmutable por pedido
CREATE TABLE order_traceability (
    order_id            UUID PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
    batch_code          VARCHAR(60) NOT NULL,
    verified_weight_g   INTEGER,
    verified_pressure   NUMERIC(4,1),
    verified_temp_c     NUMERIC(5,1),
    verified_seal_time  NUMERIC(4,1),
    integrity_hash      TEXT,                  -- hash de los valores para inmutabilidad
    confirmed_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_evidence (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    kind            VARCHAR(20) NOT NULL,      -- foto | video | firma | geo
    file_url        TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_evidence ON order_evidence(order_id);

-- Historial de transiciones de estado (auditable)
CREATE TABLE order_status_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status     order_status,
    to_status       order_status NOT NULL,
    changed_by      UUID REFERENCES users(id),
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_status_history ON order_status_history(order_id);

-- ----------------------------------------------------------------------------
-- LOGÍSTICA
-- ----------------------------------------------------------------------------
CREATE TABLE delivery_zones (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(120) NOT NULL,
    city            VARCHAR(120),
    polygon         JSONB,                     -- GeoJSON de cobertura
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE deliveries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    zone_id         UUID REFERENCES delivery_zones(id),
    courier_name    VARCHAR(160),
    current_lat     DOUBLE PRECISION,
    current_lng     DOUBLE PRECISION,
    eta_minutes     INTEGER,
    confirmed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- PAGOS
-- ----------------------------------------------------------------------------
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID REFERENCES orders(id),
    subscription_id     UUID REFERENCES subscriptions(id),
    user_id             UUID NOT NULL REFERENCES users(id),
    gateway             payment_gateway NOT NULL,
    gateway_payment_id  VARCHAR(255),
    amount_cents        INTEGER NOT NULL CHECK (amount_cents >= 0),
    currency            VARCHAR(3) NOT NULL DEFAULT 'COP',
    status              payment_status NOT NULL DEFAULT 'pendiente',
    is_recurring        BOOLEAN NOT NULL DEFAULT FALSE,
    raw_payload         JSONB,                 -- respuesta cruda de la pasarela
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

CREATE TABLE refunds (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id      UUID NOT NULL REFERENCES payments(id),
    amount_cents    INTEGER NOT NULL CHECK (amount_cents >= 0),
    reason          TEXT,
    gateway_refund_id VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payouts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practiker_id    UUID NOT NULL REFERENCES practiker_profiles(user_id),
    amount_cents    INTEGER NOT NULL CHECK (amount_cents >= 0),
    period_start    DATE,
    period_end      DATE,
    status          VARCHAR(30) NOT NULL DEFAULT 'pendiente', -- pendiente|liquidado|transferido
    transferred_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payouts_practiker ON payouts(practiker_id);

-- ----------------------------------------------------------------------------
-- IA: PRONÓSTICOS Y ASISTENTE
-- ----------------------------------------------------------------------------
CREATE TABLE demand_forecasts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_period       VARCHAR(40) NOT NULL,   -- "Semana 24-2026"
    predicted_orders    INTEGER,
    raw_materials       JSONB,                  -- [{ingredient, kg, deficit}]
    packaging_bags      INTEGER,
    insights_markdown   TEXT,
    generated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assistant_conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    context_role    user_role,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assistant_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
    role            VARCHAR(12) NOT NULL,       -- user | assistant
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_assistant_messages_conv ON assistant_messages(conversation_id);

-- ----------------------------------------------------------------------------
-- EDUCACIÓN Y COMUNIDAD
-- ----------------------------------------------------------------------------
CREATE TABLE courses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    cover_url       TEXT,
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE course_lessons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    video_url       TEXT,
    pdf_url         TEXT,
    sort_order      SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE course_enrollments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    progress_percent SMALLINT NOT NULL DEFAULT 0,
    completed_at    TIMESTAMPTZ,
    enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (course_id, user_id)
);

CREATE TABLE course_certificates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id   UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
    certificate_url TEXT,
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- TRANSVERSALES
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel         notification_channel NOT NULL,
    title           VARCHAR(200),
    body            TEXT,
    sent            BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id);

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id        UUID REFERENCES users(id),
    action          VARCHAR(120) NOT NULL,
    entity          VARCHAR(80),
    entity_id       UUID,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity, entity_id);

-- ----------------------------------------------------------------------------
-- TRIGGER: updated_at automático
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated     BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated    BEFORE UPDATE ON orders   FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- FIN DEL ESQUEMA
-- ============================================================================
