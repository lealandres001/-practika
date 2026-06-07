# PRACTIKA — Documentación técnica

Plataforma FoodTech de economía colaborativa para alistamiento culinario.

## Estado actual

- ✅ **Prototipo funcional**: React + Vite + Express con datos en memoria
  (`src/`, `server.ts`). Sirve como demo de negocio y captura el dominio real.
- 🏗️ **Fundamentos de producción** (esta carpeta): arquitectura, modelo de datos y
  esquema PostgreSQL ejecutable.

## Índice

| Documento | Contenido |
|-----------|-----------|
| [01-ARQUITECTURA.md](./01-ARQUITECTURA.md) | Visión, stack, decisiones de infra, seguridad, roadmap. |
| [02-MODELO-DATOS.md](./02-MODELO-DATOS.md) | ER (Mermaid), entidades, reglas de negocio. |
| `../database/schema.sql` | Esquema PostgreSQL 16 completo y ejecutable. |
| `../database/seed.sql` | Datos semilla derivados del prototipo. |
| `../infra/docker-compose.yml` | Postgres + Redis locales con auto-init. |

## Cómo levantar la base de datos en local

Requiere Docker.

```bash
docker compose -f infra/docker-compose.yml up -d
```

Esto crea la base `practika` con el esquema y los datos semilla cargados.
Conexión: `postgresql://practika:practika@localhost:5432/practika`.

Para inspeccionar:

```bash
docker exec -it practika-postgres psql -U practika -d practika -c "\dt"
```

## Próximos pasos (ver roadmap en 01-ARQUITECTURA.md)

1. Backend NestJS — módulo Auth + Users con hashing real.
2. Catálogo + Suscripciones.
3. Pedidos + máquina de estados + trazabilidad HACCP.
4. Marketplace inteligente, pagos, IA, logística, educativo.
5. Apps Flutter sobre la API estable.

> **Nota de seguridad importante**: el prototipo guarda contraseñas en claro en
> `users_db.json`. Eso es aceptable solo para una demo local; debe corregirse
> (hashing + JWT) antes de cualquier uso con usuarios reales.
