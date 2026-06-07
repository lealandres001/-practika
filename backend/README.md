# PRACTIKA — Backend (NestJS)

API modular de la plataforma. Primer módulo entregado: **Auth + Users**.

## Requisitos

- Node.js 20+
- PostgreSQL en marcha con el esquema cargado
  (`docker compose -f ../infra/docker-compose.yml up -d`).

## Puesta en marcha

```bash
cd backend
cp .env.example .env      # ajusta secretos y conexión
npm install
npm run start:dev
```

La API queda en `http://localhost:4000/api`.

## Seguridad implementada

- Contraseñas hasheadas con **argon2** (nunca en claro ni reversibles).
- **JWT** de acceso de vida corta + **refresh token rotatorio** (se guarda solo
  el hash SHA-256 del refresh token; al refrescar se revoca el anterior).
- **JwtAuthGuard global**: todos los endpoints requieren token salvo los marcados
  con `@Public()`.
- **RBAC** por rol (`cliente` / `practiker` / `admin`) con `@Roles()` + `RolesGuard`.
- Validación estricta de entrada con `class-validator` (DTOs, whitelist).
- Mitigación de enumeración de usuarios por tiempo de respuesta en el login.

## Endpoints

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/auth/register` | público | Registra un cliente y devuelve tokens. |
| POST | `/api/auth/login` | público | Inicia sesión. |
| POST | `/api/auth/refresh` | público | Rota el refresh token y emite nuevos. |
| POST | `/api/auth/logout` | autenticado | Revoca el refresh token presentado. |
| GET | `/api/users/me` | autenticado | Perfil propio. |
| PATCH | `/api/users/me` | autenticado | Actualiza el perfil propio. |
| GET | `/api/users` | admin | Lista usuarios. |
| GET | `/api/users/:id` | admin | Consulta un usuario. |

## Prueba rápida (curl)

```bash
# Registro
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","fullName":"Ana Pérez","password":"Practika123"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"Practika123"}'

# Perfil (usa el accessToken devuelto)
curl http://localhost:4000/api/users/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## Nota sobre las contraseñas del seed

`database/seed.sql` inserta usuarios demo con `password_hash = '$placeholder$'`,
que **no es un hash válido** a propósito: esas cuentas no pueden iniciar sesión
hasta que se les asigne una contraseña real vía `/api/auth/register` o un script
de administración. Así evitamos credenciales por defecto explotables.
