# PRACTIKA API (backend)

API REST de PRACTIKA con **Node.js + Express** y arquitectura limpia y modular. Sirve además el frontend estático, así que web + API quedan en el mismo origen.

## Requisitos

- **Node.js 18 o superior** (incluye `npm`). Descárgalo en https://nodejs.org

## Arrancar en 2 pasos

Desde la carpeta `server/`:

```bash
npm install
npm start
```

Verás:

```
PRACTIKA API en marcha 🍳
Web:  http://localhost:4000/
API:  http://localhost:4000/api/health
```

Abre `http://localhost:4000/` y tendrás la **página + el backend** funcionando juntos. Los datos se guardan en `server/data/db.json` (se crea solo).

> Reiniciar datos demo: `npm run seed` (o `POST /api/admin/reset`).

## Configuración (.env)

Copia `.env.example` a `.env` y ajusta si necesitas:

| Variable      | Por defecto | Descripción                              |
|---------------|-------------|------------------------------------------|
| `PORT`        | `4000`      | Puerto del servidor                      |
| `CORS_ORIGIN` | `*`         | Origen permitido para la web             |
| `STORAGE`     | `file`      | `file` (JSON) o `postgres` (producción)  |
| `DATABASE_URL`| —           | Cadena de conexión PostgreSQL            |

## Arquitectura

```
server/
├── src/
│   ├── config/env.js              # Variables de entorno
│   ├── data/
│   │   ├── seed.js                # Datos semilla
│   │   ├── db.js                  # Persistencia JSON (aísla almacenamiento)
│   │   └── reset.js               # Re-siembra (npm run seed)
│   ├── repositories/              # Acceso a datos
│   ├── services/                  # Lógica de negocio (catálogo, pedidos, routing, IA, métricas)
│   ├── controllers/               # Adaptan HTTP <-> servicios
│   ├── routes/index.js            # Endpoints REST
│   ├── middleware/error.js        # 404 + manejo de errores
│   ├── app.js                     # App Express
│   └── server.js                  # Arranque
└── db/schema.sql                  # Esquema PostgreSQL (producción)
```

## Endpoints

| Método | Ruta                              | Descripción                          |
|--------|-----------------------------------|--------------------------------------|
| GET    | `/api/health`                     | Estado del servicio                  |
| GET    | `/api/categories`                 | Categorías                           |
| GET    | `/api/products?category=salsas`   | Productos (filtro opcional)          |
| GET    | `/api/products/:id`               | Detalle de producto                  |
| GET    | `/api/plans`                      | Planes (con precio final)            |
| GET    | `/api/courses`                    | Cursos (Fase 3)                      |
| GET    | `/api/zones`                      | Zonas de cobertura                   |
| GET    | `/api/operators`                  | Operadores                           |
| GET    | `/api/orders`                     | Pedidos (con zona y operador)        |
| GET    | `/api/orders/:id`                 | Detalle de pedido                    |
| POST   | `/api/orders`                     | Crear pedido (asigna operador)       |
| POST   | `/api/orders/:id/advance`         | Avanzar estado                       |
| PATCH  | `/api/orders/:id/traceability`    | Guardar lote/peso/sellado            |
| GET    | `/api/admin/metrics`              | KPIs + demanda por categoría         |
| GET    | `/api/admin/prediction`           | Pronóstico IA + aprovisionamiento    |
| POST   | `/api/admin/reset`                | Reiniciar datos demo                 |

### Ejemplo: crear un pedido

```bash
curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "subscription",
    "zone_id": 1,
    "delivery_day": "Miércoles",
    "delivery_slot": "11:00 – 14:00",
    "items": [{ "product_id": 201, "qty": 1 }, { "product_id": 401, "qty": 2 }],
    "customer": { "name": "Ana López", "email": "ana@ejemplo.com", "address": "Calle 10 # 5-20" }
  }'
```

## Conectar el frontend al backend (multiusuario)

El frontend trae un cliente listo en `js/core/api.js` (`PRACTIKA.Api`). Como el servidor ya sirve la web, al abrir `http://localhost:4000/` la base de la API es `/api` automáticamente. El siguiente paso de integración es que las vistas usen `PRACTIKA.Api` (asíncrono) en lugar del `Store` local para compartir datos entre todos los usuarios.

## Pasar a PostgreSQL (persistencia permanente)

El adaptador ya está implementado (`src/data/storage/postgres.store.js`). Solo configura el entorno:

1. Crea una base PostgreSQL (local o gestionada: Neon, Supabase, Render, RDS…).
2. En `.env` define:
   ```
   STORAGE=postgres
   DATABASE_URL=postgresql://usuario:clave@host:5432/practika
   ```
3. Arranca normal: `npm install && npm start`.

El servidor crea solo la tabla `practika_state` (documento JSONB) y siembra los datos la primera vez. El SSL se activa automáticamente cuando el host no es `localhost`.

- **Reiniciar datos**: `npm run seed`.
- **Modelo relacional completo**: `db/schema.sql` queda disponible para migrar a tablas normalizadas (productos, pedidos, order_items, etc.) cuando se necesite escala.

> Estrategia actual: el estado se guarda como un único documento JSONB. Es permanente, simple y de bajo riesgo para el MVP. Para alto volumen/concurrencia se migra al esquema relacional de `db/schema.sql` con consultas por entidad.

## Desplegar el backend

- **Render / Railway / Fly.io**: detectan Node, ejecutan `npm install` y `npm start`. Define `PORT` por variable de entorno (el código ya lo respeta).
- Para datos persistentes en la nube, usa PostgreSQL administrado (Neon, Supabase, RDS).
