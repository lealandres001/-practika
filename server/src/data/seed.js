/* ============================================================
   PRACTIKA API · data/seed.js
   Datos semilla iniciales. Espejo del catálogo del frontend.
   ============================================================ */
export function seedData() {
  return {
    categories: [
      { id: 1, slug: "bases",      name: "Bases y Condimentos", emoji: "🧄", description: "Pastas y bases naturales procesadas listas para cocinar." },
      { id: 2, slug: "salsas",     name: "Salsas",              emoji: "🥫", description: "Salsas artesanales premium para realzar cada plato." },
      { id: 3, slug: "soluciones", name: "Soluciones Listas",   emoji: "🥗", description: "Vegetales picados y mix listos al vacío para la semana." },
      { id: 4, slug: "proteinas",  name: "Proteínas",           emoji: "🥩", description: "Proteínas marinadas o cocidas, porcionadas y empacadas al vacío." }
    ],
    products: [
      { id: 101, category_id: 1, name: "Pasta de ajo natural",        description: "Ajo procesado natural, sin conservantes.",          price_cop: 9800,  unit: "Frasco 250 g",  vacuum_packed: false, emoji: "🧄" },
      { id: 102, category_id: 1, name: "Base de sofrito criollo",     description: "Cebolla, pimentón y tomate procesados.",            price_cop: 12500, unit: "Frasco 300 g",  vacuum_packed: false, emoji: "🧅" },
      { id: 103, category_id: 1, name: "Mix de especias parrilleras", description: "Blend artesanal para carnes y asados.",             price_cop: 11000, unit: "Frasco 120 g",  vacuum_packed: false, emoji: "🌶️" },
      { id: 201, category_id: 2, name: "Chimichurri premium",         description: "Receta del Chef Álvaro, hierbas frescas.",          price_cop: 15900, unit: "Frasco 250 ml", vacuum_packed: false, emoji: "🌿" },
      { id: 202, category_id: 2, name: "Teriyaki artesanal",          description: "Salsa teriyaki reducida lentamente.",               price_cop: 16900, unit: "Frasco 250 ml", vacuum_packed: false, emoji: "🥢" },
      { id: 203, category_id: 2, name: "Salsa criolla",               description: "Clásica salsa criolla lista para servir.",          price_cop: 13500, unit: "Frasco 250 ml", vacuum_packed: false, emoji: "🍅" },
      { id: 301, category_id: 3, name: "Mix confit de vegetales",     description: "Vegetales picados y confitados al vacío.",          price_cop: 18500, unit: "Bolsa 500 g",   vacuum_packed: true,  emoji: "🥕" },
      { id: 302, category_id: 3, name: "Sofrito semanal al vacío",    description: "Picado fino listo para 5 preparaciones.",           price_cop: 14900, unit: "Bolsa 400 g",   vacuum_packed: true,  emoji: "🥬" },
      { id: 303, category_id: 3, name: "Verduras para wok",           description: "Brócoli, zanahoria y pimentón en juliana.",         price_cop: 16200, unit: "Bolsa 450 g",   vacuum_packed: true,  emoji: "🥦" },
      { id: 401, category_id: 4, name: "Res desmechada",              description: "Res cocida y desmechada, empacada al vacío.",       price_cop: 28900, unit: "Porción 300 g", vacuum_packed: true,  emoji: "🥩" },
      { id: 402, category_id: 4, name: "Cerdo marinado",              description: "Lomo de cerdo marinado 12 h.",                      price_cop: 26500, unit: "Porción 350 g", vacuum_packed: true,  emoji: "🐖" },
      { id: 403, category_id: 4, name: "Pechuga cocida",              description: "Pechuga de pollo cocida sous-vide.",                price_cop: 22900, unit: "Porción 300 g", vacuum_packed: true,  emoji: "🍗" },
      { id: 404, category_id: 4, name: "Hamburguesas artesanales",    description: "Pack x4 hamburguesas de res al vacío.",             price_cop: 24500, unit: "Pack x4 (480 g)", vacuum_packed: true, emoji: "🍔" }
    ],
    plans: [
      { id: 1, name: "Plan Esencial", description: "Alistamiento básico mensual.",      price_cop: 89000,  discount_pct: 10, items: [101, 102, 201, 203] },
      { id: 2, name: "Plan Familiar", description: "El más pedido.",                    price_cop: 159000, discount_pct: 15, items: [102, 201, 301, 401, 403] },
      { id: 3, name: "Plan Premium",  description: "Alistamiento completo, cero mermas.", price_cop: 229000, discount_pct: 20, items: [103, 202, 301, 303, 401, 402, 404] }
    ],
    zones: [
      { id: 1, name: "Centro",       lat: 4.1420, lng: -73.6266 },
      { id: 2, name: "Barzal",       lat: 4.1480, lng: -73.6400 },
      { id: 3, name: "La Esperanza", lat: 4.1280, lng: -73.6350 },
      { id: 4, name: "Porfía",       lat: 4.0850, lng: -73.6700 }
    ],
    operators: [
      { id: 1, name: "Laura Méndez",  zone_id: 1, lat: 4.1430, lng: -73.6270, certified: true,  capacity: 12, load: 3, rating: 4.9 },
      { id: 2, name: "Andrés Patiño", zone_id: 2, lat: 4.1475, lng: -73.6395, certified: true,  capacity: 10, load: 5, rating: 4.7 },
      { id: 3, name: "Diana Castro",  zone_id: 3, lat: 4.1290, lng: -73.6360, certified: true,  capacity: 14, load: 2, rating: 4.8 },
      { id: 4, name: "Julián Rojas",  zone_id: 4, lat: 4.0860, lng: -73.6710, certified: false, capacity: 8,  load: 0, rating: 0 }
    ],
    courses: [
      { id: 1, title: "Alistamiento de cocina para 30 días", emoji: "📅", description: "El método del Chef Álvaro.", lessons: ["Día 1 · Mentalidad y mermas cero", "Día 2 · Organización de la despensa", "Día 3 · Porcionado y empaque al vacío"], pdf: "guia-alistamiento-30-dias.pdf", challenge: "Organiza tu despensa en 3 zonas durante 7 días." },
      { id: 2, title: "Salsas madre del Chef Álvaro", emoji: "🥫", description: "Domina 5 salsas base.", lessons: ["Chimichurri paso a paso", "Teriyaki: la reducción", "Conservación al vacío"], pdf: "recetario-salsas-madre.pdf", challenge: "Prepara 2 salsas y consérvalas al vacío 10 días." }
    ],
    salesHistory: [
      { week: "Sem -4", "Bases y Condimentos": 38, "Salsas": 52, "Soluciones Listas": 61, "Proteínas": 74 },
      { week: "Sem -3", "Bases y Condimentos": 41, "Salsas": 55, "Soluciones Listas": 66, "Proteínas": 79 },
      { week: "Sem -2", "Bases y Condimentos": 44, "Salsas": 58, "Soluciones Listas": 72, "Proteínas": 85 },
      { week: "Sem -1", "Bases y Condimentos": 47, "Salsas": 63, "Soluciones Listas": 78, "Proteínas": 92 }
    ],
    orders: [
      { id: "PR-1001", user_id: 1, user_name: "María Gómez", type: "subscription", items: [{ product_id: 201, qty: 1 }, { product_id: 401, qty: 2 }], subtotal: 73700, total: 66330, zone_id: 1, operator_id: 1, assignment_distance: 0.1, traceability: { lot: "", weight: "", vacuum_ok: false }, delivery_day: "Miércoles", delivery_slot: "11:00 – 14:00", status: "pendiente", payment_status: "pagado", created_at: "2026-06-03T09:12:00.000Z" },
      { id: "PR-1002", user_id: 2, user_name: "Carlos Ruiz", type: "single", items: [{ product_id: 301, qty: 1 }, { product_id: 403, qty: 1 }], subtotal: 41400, total: 41400, zone_id: 3, operator_id: 3, assignment_distance: 0.2, traceability: { lot: "LT-0440", weight: "", vacuum_ok: false }, delivery_day: "Viernes", delivery_slot: "14:00 – 17:00", status: "preparacion", payment_status: "pagado", created_at: "2026-06-04T16:40:00.000Z" }
    ],
    meta: { seq: 1002 }
  };
}
