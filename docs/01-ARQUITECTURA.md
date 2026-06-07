# PRACTIKA — Arquitectura Tecnológica

> FoodTech de economía colaborativa para alistamiento culinario.
> Documento vivo. Versión 0.1 — fundamentos.

## 1. Visión de arquitectura

PRACTIKA es un marketplace de tres lados:

- **Clientes**: compran productos y suscripciones de alistamiento culinario.
- **Practikers** (operadores culinarios certificados): producen bajo estándares HACCP.
- **Administradores**: controlan operación, finanzas y logística.

El sistema se diseña como un **monolito modular** en el backend (NestJS) que puede
extraerse a microservicios cuando la carga lo justifique. Empezar con microservicios
desde cero para una startup es un error caro: añade complejidad operativa antes de
tener tracción. La regla es: **módulos con fronteras claras hoy, servicios separados
cuando un módulo lo pida** (escala, equipo dedicado o tasa de cambio distinta).

```
                         ┌─────────────────────────┐
                         │      Clientes finales    │
                         └────────────┬────────────┘
            ┌──────────────┬──────────┴───────┬──────────────────┐
            │              │                  │                  │
      ┌─────▼─────┐  ┌─────▼─────┐     ┌──────▼──────┐    ┌───────▼───────┐
      │ App Cliente│  │App Practiker│   │ Panel Admin │    │ Landing / Web │
      │  (Flutter) │  │  (Flutter)  │   │  (Next.js)  │    │   (Next.js)   │
      └─────┬─────┘  └─────┬───────┘   └──────┬──────┘    └───────┬───────┘
            └──────────────┴──────────┬───────┴──────────────────┘
                                      │  HTTPS / REST + WebSocket
                            ┌─────────▼──────────┐
                            │   API Gateway /    │
                            │   Load Balancer    │   (AWS ALB)
                            └─────────┬──────────┘
                            ┌─────────▼──────────┐
                            │   Backend NestJS   │  (monolito modular)
                            │  ┌──────────────┐  │
                            │  │ Auth         │  │
                            │  │ Users        │  │
                            │  │ Catalog      │  │
                            │  │ Orders       │  │
                            │  │ Subscriptions│  │
                            │  │ Marketplace  │  │
                            │  │ Logistics    │  │
                            │  │ Payments     │  │
                            │  │ AI / ML      │  │
                            │  │ Education    │  │
                            │  │ Notifications│  │
                            │  └──────────────┘  │
                            └──┬────────┬────────┬┘
              ┌────────────────┘        │        └────────────────┐
       ┌──────▼──────┐          ┌───────▼──────┐          ┌────────▼────────┐
       │ PostgreSQL  │          │    Redis     │          │     AWS S3      │
       │ (RDS Multi- │          │ (cache, cola,│          │ (fotos, videos, │
       │   AZ)       │          │  rate-limit) │          │  evidencias)    │
       └─────────────┘          └──────────────┘          └─────────────────┘
                            ┌─────────────────────────────┐
                            │   Integraciones externas    │
                            │  Stripe / MercadoPago /     │
                            │  ePayco / Bold / PayPal     │
                            │  Google Maps · FCM · Twilio │
                            │  WhatsApp Cloud API · Gemini│
                            └─────────────────────────────┘
```

## 2. Stack tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Móvil cliente y operador | Flutter | Una base de código para iOS + Android. |
| Web (panel admin + landing) | Next.js (App Router) | SSR/SEO, panel rico, despliegue sencillo. |
| Backend | NestJS (Node + TypeScript) | Modular, DI, testeable, ecosistema maduro. |
| Base de datos | PostgreSQL 16 | Relacional, transaccional, JSONB para flexibilidad. |
| Cache / colas | Redis 7 | Cache de catálogo, rate-limit, colas BullMQ. |
| Almacenamiento | AWS S3 | Fotos de producto, evidencias HACCP, certificados. |
| Infraestructura | AWS (ECS/EKS) | Escala gestionada, Multi-AZ. |
| Contenedores | Docker | Reproducibilidad dev → prod. |
| Orquestación | Kubernetes (EKS) o ECS Fargate | EKS si hay equipo de plataforma; Fargate si no. |
| Auth | JWT (access + refresh) + OAuth2 | Google, Apple, Facebook + email. |
| Mapas | Google Maps Platform | Geocoding, rutas, distancia para marketplace. |
| Notificaciones | Firebase Cloud Messaging + Twilio/WhatsApp Cloud API | Push, SMS, WhatsApp. |
| IA | Gemini (Google GenAI) + modelo propio de forecast | Asistente y predicción de demanda. |
| Analítica | Google Analytics 4 + Mixpanel | Producto y embudo. |
| Observabilidad | OpenTelemetry → CloudWatch / Grafana | Trazas, métricas, logs. |

> Nota de pragmatismo: el prototipo actual (React + Vite + Express, datos en memoria)
> es válido como **demo de negocio**. La migración al stack de producción se hace por
> módulos, sin botar el conocimiento de dominio ya capturado en `src/types.ts` y `server.ts`.

## 3. Decisión: ¿ECS Fargate o EKS?

- **Arranque (MVP comercial)**: **ECS Fargate**. Sin nodos que administrar, escala por
  tarea, suficiente para miles de usuarios. Menor carga operativa.
- **Cuando escale**: migrar a **EKS (Kubernetes)** si se necesita autoscaling fino,
  multirregión o múltiples equipos. Los manifiestos K8s se preparan desde ya (carpeta
  `infra/k8s`) para que la migración no sea un rediseño.

## 4. Seguridad (transversal)

- TLS en todo el tráfico (ALB + ACM).
- Contraseñas con **bcrypt/argon2** (el prototipo actual guarda contraseñas en claro en
  `users_db.json` — **esto se debe corregir antes de cualquier uso real**).
- JWT de acceso de vida corta (15 min) + refresh token rotatorio en almacenamiento seguro.
- Autorización por rol (RBAC): `cliente`, `practiker`, `admin`.
- Secretos en **AWS Secrets Manager**, nunca en el repo.
- Rate-limiting con Redis en endpoints de auth y pago.
- Validación de entrada con `class-validator` (DTOs) en cada endpoint.
- Webhooks de pago verificados por firma.
- Auditoría de acciones administrativas y trazabilidad HACCP inmutable.

## 5. Trazabilidad HACCP (diferenciador del negocio)

El dominio ya modela puntos críticos de control (PCC): peso verificado, presión de
vacío, temperatura y tiempo de sellado, código de lote y timestamp de empaque. Esto es
un activo regulatorio y comercial. En producción se almacena como **registro inmutable**
(append-only) por pedido, con evidencia (foto/video/firma) en S3 y hash de integridad.

## 6. Estrategia de despliegue

| Entorno | Propósito | Datos |
|---------|-----------|-------|
| `local` | Desarrollo | Docker Compose (Postgres + Redis) |
| `staging` | QA / demos a inversión | RDS pequeño, datos sintéticos |
| `production` | Operación real | RDS Multi-AZ, backups, réplicas de lectura |

CI/CD con GitHub Actions: lint → test → build de imagen → push a ECR → deploy.

## 7. Roadmap de construcción (incremental)

1. **Fundamentos** ← *este documento + modelo de datos + esquema SQL*.
2. Backend NestJS: Auth + Users (con hashing real).
3. Catálogo + Suscripciones.
4. Pedidos + máquina de estados + trazabilidad HACCP.
5. Marketplace inteligente (algoritmo de asignación).
6. Pagos (empezar con 1 pasarela: Stripe o MercadoPago) + webhooks.
7. Notificaciones (FCM + WhatsApp/SMS).
8. IA: asistente (ya existe con Gemini) + forecast de demanda.
9. Logística (rutas, zonas, GPS).
10. Educativo + comunidad.
11. Apps Flutter sobre la API estable.
12. Infra AWS + K8s + observabilidad + pruebas E2E.

Ver `02-MODELO-DATOS.md` y `../database/schema.sql` para el siguiente nivel de detalle.
