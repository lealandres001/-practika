# PRACTIKA — Plataforma de Economía Colaborativa para el Alistamiento Culinario

Versión **final de demostración** con las 3 fases del PRD integradas en un prototipo navegable. Conecta hogares (Clientes) con operadores culinarios certificados ("Practikers") para entregar alistamiento porcionado, marinado o cocido y empacado al vacío.

## Dos modos de funcionamiento

La app detecta automáticamente si hay backend disponible (indicador en el encabezado):

- **● Local (demo):** abres `index.html` directo. Los datos viven en tu navegador (`localStorage`). Ideal para mostrar la app sin instalar nada.
- **● En línea (servidor):** corres el backend de `server/` y abres `http://localhost:4000/`. Ahora los datos son **compartidos y multiusuario**: el pedido que crea un Cliente lo ven el Operador y el Administrador en tiempo real.

> La capa `js/core/gateway.js` decide entre servidor y local sin que las vistas tengan que cambiar.

## Modo local (sin instalar nada)

```
index.html
```

Doble clic y corre en cualquier navegador moderno. El selector de rol arriba a la derecha permite recorrer los 3 actores en vivo.

## Modo multiusuario (con backend)

```
cd server
npm install
npm start
```

Abre `http://localhost:4000/` (necesitas Node.js 18+). Detalles y endpoints en `server/README.md`.

> Para servirla en red durante una demo, cuando tengas Python/Node: `python -m http.server` o cualquier hosting estático (GitHub Pages, Netlify, Vercel).

## Guion sugerido para la demostración

1. **Cliente** — Recorre el catálogo (4 categorías), suscríbete a un plan en 3 clics, elige zona + día + franja de entrega y paga (pasarela simulada). En la confirmación verás el **operador asignado automáticamente** por cercanía.
2. **Academia** — Muestra los info-productos (cursos, PDFs, retos) de la Fase 3.
3. **Operador** — Cambia de rol: aparece el pedido recién creado. Recorre el **checklist guiado**, registra la **trazabilidad del lote** (lote, peso, sellado al vacío) y avanza el estado.
4. **Administrador** — KPIs (ingresos, MRR, suscripción), demanda por categoría, **predicción de demanda con IA**, aprovisionamiento por operador y la **red de operadores**.

## Fases implementadas

### Fase 1 — MVP Operativo
- Catálogo con las 4 categorías: Bases y Condimentos, Salsas, Soluciones Listas, Proteínas.
- Planes de suscripción (Esencial, Familiar, Premium) en ≤3 clics.
- Carrito con modo Suscripción (cobro recurrente, -10%) o Pedido único.
- Agendamiento logístico (zona + día + ventana horaria) y checkout con pasarela simulada (ePayco/Bold/MercadoPago).

### Fase 2 — Marketplace Colaborativo
- **Enrutamiento inteligente**: asigna el pedido al operador certificado más cercano con capacidad libre (distancia Haversine).
- Red de operadores con zonas, capacidad, carga y rating.
- App del operador con **flujo guiado** y **trazabilidad de lote** (lote, peso exacto, confirmación de sellado al vacío).

### Fase 3 — Escala & IA
- **Academia**: videocursos ("Alistamiento de cocina para 30 días", "Salsas madre"), PDFs descargables y retos.
- **IA de predicción de demanda**: media móvil + tendencia sobre el historial; proyecta la próxima semana por categoría y sugiere aprovisionamiento por operador para reducir mermas.

## Arquitectura (limpia y modular)

```
index.html
assets/css/styles.css
js/
├── data/seed.js                # Datos semilla (catálogo, planes, zonas, operadores, cursos, historial)
├── core/
│   ├── store.js                # Persistencia (localStorage). Único punto de acceso a datos.
│   ├── state.js                # Estado de sesión (rol, vista, modo)
│   └── format.js               # Formato moneda/fecha + toasts
├── services/                   # Lógica de negocio (sin DOM)
│   ├── catalog.service.js
│   ├── cart.service.js
│   ├── order.service.js
│   ├── routing.service.js      # [Fase 2] enrutamiento por geolocalización
│   ├── metrics.service.js
│   └── prediction.service.js   # [Fase 3] forecast de demanda
├── ui/                         # Vistas (render + eventos)
│   ├── components.js
│   ├── catalog.view.js
│   ├── checkout.view.js
│   ├── academy.view.js         # [Fase 3]
│   ├── operator.view.js        # [Fase 2] trazabilidad
│   └── admin.view.js           # KPIs + IA + red de operadores
└── app.js                      # Router / navegación / init
```

La capa `Store` aísla el almacenamiento: para producción se reemplaza por una **API REST** (FastAPI/Express) sobre **PostgreSQL** sin tocar servicios ni UI.

## Modelo de datos (portable a PostgreSQL)

```
categories (id, slug, name, description, emoji)
products   (id, category_id → categories, name, description, price_cop, unit, vacuum_packed, emoji)
plans      (id, name, description, price_cop, discount_pct, items[])
zones      (id, name, lat, lng)
operators  (id, name, zone_id → zones, lat, lng, certified, capacity, load, rating)
orders     (id, user_id, type[subscription|single], items[], subtotal, total,
            zone_id → zones, operator_id → operators, assignment_distance,
            traceability{lot, weight, vacuum_ok},
            delivery_day, delivery_slot,
            status[pendiente|preparacion|listo|entregado], payment_status, created_at)
courses    (id, title, lessons[], pdf, challenge)
salesHistory (week, category, qty)
```

## De prototipo a producción (siguiente paso)

- Backend real: **FastAPI + PostgreSQL** (o Node/Express), reemplazando `Store` por endpoints.
- App móvil nativa con **React Native / Flutter** reutilizando la lógica de servicios.
- Pasarela de pagos real con cobros recurrentes (ePayco/Bold/MercadoPago).
- Despliegue en **AWS / Google Cloud** (serverless) con entornos Staging y Production.

---
Autor/Fundador: **Chef Álvaro Ibáñez Peluffo** · Respaldo metodológico: **ParqueSoft Meta**.
