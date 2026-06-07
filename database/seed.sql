-- ============================================================================
-- PRACTIKA — Datos semilla (derivados del prototipo)
-- Ejecutar DESPUÉS de schema.sql.
-- Idempotente por SKU/email donde aplica (ON CONFLICT DO NOTHING).
-- ============================================================================

-- ---------- Categorías ----------
INSERT INTO categories (name, sort_order) VALUES
    ('Bases', 1),
    ('Salsas', 2),
    ('Vegetales', 3),
    ('Proteínas', 4)
ON CONFLICT (name) DO NOTHING;

-- ---------- Productos ----------
INSERT INTO products (sku, category_id, name, description, price_cents, unit, weight_grams, image_url, vacuum_sealed, shelf_life_days, suggested_stock)
SELECT v.sku, c.id, v.name, v.description, v.price_cents, v.unit, v.weight_grams, v.image_url, TRUE, v.shelf_life_days, v.suggested_stock
FROM (VALUES
    ('prod-ajo-01',        'Bases',     'Pasta de Ajo Natural Confitada',        'Pasta pura de ajo procesada en frío con aceite de girasol y sal marina.', 1850000,  'Tarro al Vacío',  250, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe', 45, 50),
    ('prod-criolla-01',    'Bases',     'Saborizador Criollo Concentrado',       'Base tradicional colombiana de cebolla larga, ajo, pimentón asado, cilantro y comino.', 1600000, 'Tarro al Vacío', 250, 'https://images.unsplash.com/photo-1596797038530-2c107229654b', 30, 40),
    ('prod-chimi-01',      'Salsas',    'Chimichurri Premium Parrillero',        'Emulsión al vacío con perejil crespo, orégano patagónico, vinagre tinto, limón, ajo y cayena.', 2450000, 'Frasco al Vacío', 200, 'https://images.unsplash.com/photo-1547592180-85f173990554', 60, 35),
    ('prod-teri-01',       'Salsas',    'Teriyaki Artesanal Glaseado',           'Salsa espesa con soya fermentada, jengibre, mirin y panela orgánica.', 2200000, 'Frasco al Vacío', 200, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd', 60, 30),
    ('prod-mixveg-01',     'Vegetales', 'Mix Confit Vegetales Semanales',        'Cubos de zanahoria, calabacín, brócoli y pimentones sazonados al vacío.', 3200000, 'Bolsa al Vacío', 500, 'https://images.unsplash.com/photo-1540420773420-3366772f4999', 10, 65),
    ('prod-pure-01',       'Vegetales', 'Puré Rústico de Papa Amarilla',         'Papa criolla prensada al vacío con mantequilla clarificada y nuez moscada.', 2600000, 'Bolsa al Vacío', 500, 'https://images.unsplash.com/photo-1518492104633-130d0cc84637', 14, 45),
    ('prod-resmechada-01', 'Proteínas', 'Res Culinaria Desmechada Cocida',       'Pecho de res desmechado cocido a baja temperatura 24h al vacío.', 4900000, 'Bolsa al Vacío', 500, 'https://images.unsplash.com/photo-1544025162-d76694265947', 21, 80),
    ('prod-pechuga-01',    'Proteínas', 'Pechuga Marinada al Romero',            'Suprema de pollo marinada al vacío con romero, oliva y limón.', 3400000, 'Bolsa al Vacío a Porción', 400, 'https://images.unsplash.com/photo-1604503468506-a8da13d82791', 14, 75),
    ('prod-cerdo-01',      'Proteínas', 'Cerdo Criollo Confitado Terminado',     'Panceta de cerdo confitada con panela, naranja y ajo, lista para dorar.', 4200000, 'Bolsa al Vacío', 500, 'https://images.unsplash.com/photo-1544025162-d76694265947', 21, 60)
) AS v(sku, category_name, name, description, price_cents, unit, weight_grams, image_url, shelf_life_days, suggested_stock)
JOIN categories c ON c.name = v.category_name
ON CONFLICT (sku) DO NOTHING;

-- ---------- Planes de suscripción ----------
INSERT INTO subscription_plans (sku, name, description, price_monthly_cents, frequency, deliveries_per_month, categories_included, features)
VALUES
    ('sub-esencial', 'Plan Alistamiento Esencial', 'Para personas solas o parejas. Aderezos rápidos y mixes de vegetales listos.', 14900000, 'semanal', 4,
     '["Bases","Salsas","Vegetales"]',
     '["4 entregas mensuales sin costo de envío","2 bases y 1 salsa por entrega","400g de vegetales por semana","Acceso a cursos del Chef Álvaro"]'),
    ('sub-familiar', 'Plan Familiar Conveniencia', 'El plan estrella. Almuerzos y cenas para familias de 3-5 integrantes.', 29900000, 'quincenal', 2,
     '["Bases","Salsas","Vegetales","Proteínas"]',
     '["2 entregas mensuales de alto volumen","Aliños, salsas y vegetales para 15 días","3 bloques de proteína premium 500g","Pausa o cancela con 1 clic"]'),
    ('sub-alto-proteico', 'Plan Carnes & Proteínas Premium', 'Enfocado en rendimiento físico. Proteínas cocidas a baja temperatura.', 39900000, 'semanal', 4,
     '["Salsas","Proteínas"]',
     '["4 entregas mensuales (Kits de Proteínas)","1.2Kg de proteínas al vacío por semana","Salsas funcionales sin preservantes","Control de macronutrientes impreso"]')
ON CONFLICT (sku) DO NOTHING;

-- ---------- Usuarios demo (contraseñas DEBEN re-hashearse en backend real) ----------
-- password_hash aquí es un placeholder; el backend reemplaza con argon2/bcrypt.
INSERT INTO users (email, full_name, phone, role, email_verified, password_hash) VALUES
    ('lealandres007@gmail.com', 'Andres Leal',      '3238217994', 'cliente',   TRUE, '$placeholder$'),
    ('carlos.practiker@practika.co', 'Carlos Mario Restrepo', '3110000001', 'practiker', TRUE, '$placeholder$'),
    ('sandra.camargo@practika.co',   'Sandra Camargo Valenzuela', '3110000002', 'practiker', TRUE, '$placeholder$'),
    ('admin@practika.co', 'Director SGC', '3110000003', 'admin', TRUE, '$placeholder$')
ON CONFLICT (email) DO NOTHING;

-- ---------- Perfiles de practiker ----------
INSERT INTO practiker_profiles (user_id, status, rating, location_name, latitude, longitude, completed_orders, current_workload)
SELECT u.id, 'active', 4.90, 'Micro-centro ParqueSoft Meta', 4.142, -73.626, 142, 1
FROM users u WHERE u.email = 'carlos.practiker@practika.co'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO practiker_profiles (user_id, status, rating, location_name, latitude, longitude, completed_orders, current_workload)
SELECT u.id, 'active', 4.85, 'Co-cocina Local Barzal', 4.150, -73.635, 98, 0
FROM users u WHERE u.email = 'sandra.camargo@practika.co'
ON CONFLICT (user_id) DO NOTHING;

-- ---------- Zonas de entrega ----------
INSERT INTO delivery_zones (name, city) VALUES
    ('Centro / Barzal', 'Villavicencio'),
    ('Catama / Norte',  'Villavicencio')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIN DEL SEED
-- ============================================================================
