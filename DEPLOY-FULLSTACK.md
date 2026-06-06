# 🚀 Desplegar PRACTIKA completa (web + backend) con URL pública

El servidor de Express **sirve la página y la API en el mismo servicio**, así que solo despliegas una cosa y obtienes la app multiusuario en una URL pública con HTTPS.

> Necesitas subir el proyecto a un repositorio de **GitHub** primero (es el paso común para Render y Railway). Si no tienes Git, instálalo desde https://git-scm.com

---

## Paso 0 — Subir el proyecto a GitHub

```bash
git init
git add .
git commit -m "PRACTIKA - web + backend"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/practika.git
git push -u origin main
```

---

## Opción A — Render (recomendada, plan gratis)

Ya dejé el archivo `render.yaml` (Blueprint), así que es casi automático:

1. Entra a **https://render.com** y crea cuenta (puedes usar tu GitHub).
2. **New → Blueprint**.
3. Conecta tu repositorio `practika`. Render leerá `render.yaml` solo.
4. Click en **Apply**. Render hará:
   - Build: `npm install --prefix server`
   - Start: `node server/src/server.js`
5. En 1-2 minutos tendrás una URL como `https://practika.onrender.com`.
6. Verifica: abre la URL (verás la app con "● En línea") y `https://practika.onrender.com/api/health`.

**Configuración manual (si no usas el Blueprint):**
- Environment: `Node`
- Build Command: `npm install --prefix server`
- Start Command: `node server/src/server.js`
- Health Check Path: `/api/health`

---

## Opción B — Railway

Ya dejé `railway.json` y `Procfile`.

1. Entra a **https://railway.app** y crea cuenta con GitHub.
2. **New Project → Deploy from GitHub repo** y elige `practika`.
3. Railway detecta Node (Nixpacks), ejecuta el build y el start de `railway.json`.
4. En **Settings → Networking → Generate Domain** obtienes la URL pública.
5. Verifica `/api/health`.

---

## Opción C — Cualquier host Node (Heroku, Fly.io, etc.)

- Usa el `Procfile` (`web: node server/src/server.js`) y `package.json` de la raíz.
- Build: `npm install --prefix server` · Start: `npm start`.

---

## Variables de entorno (opcionales)

| Variable      | Valor sugerido | Notas                                   |
|---------------|----------------|-----------------------------------------|
| `PORT`        | (lo asigna el host) | El código ya lo respeta.           |
| `STORAGE`     | `file`         | JSON local. Para datos persistentes reales usa `postgres`. |
| `CORS_ORIGIN` | `*`            | Restríngelo a tu dominio en producción. |

---

## ⚠️ Sobre la persistencia en planes gratuitos

Con `STORAGE=file`, los datos se guardan en `server/data/db.json`. En Render/Railway el disco es **efímero**: al reiniciar o redeploy, los datos vuelven al estado semilla. Perfecto para una **demo pública multiusuario**.

Para datos permanentes (producción real):
1. Crea una base **PostgreSQL** administrada (Neon, Supabase o el add-on del host).
2. Ejecuta `server/db/schema.sql`.
3. Implementa el adaptador `postgres` en `server/src/data/` (con el paquete `pg`) respetando la API de los repositorios.
4. Define `STORAGE=postgres` y `DATABASE_URL=...`.

---

## ✅ Resultado

Una URL pública donde Cliente, Operador y Administrador comparten los mismos datos en vivo. Ábrela en dos dispositivos: crea un pedido como Cliente y velo aparecer en el panel del Operador y del Administrador.
