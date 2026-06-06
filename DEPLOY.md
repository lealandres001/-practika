# 🚀 Publicar PRACTIKA hoy mismo

La app es 100% estática (no necesita servidor ni compilación). Aquí tienes 3 formas de dejarla en internet con una URL pública y HTTPS. **La Opción A toma ~1 minuto y no requiere instalar nada.**

---

## ✅ Opción A — Netlify Drop (la más rápida, sin instalar nada)

1. Abre en tu navegador: **https://app.netlify.com/drop**
2. Abre el explorador de archivos en `C:\Users\HP\Desktop\prueba1`.
3. **Arrastra la carpeta completa `prueba1`** y suéltala en la página de Netlify.
4. En segundos te dará una URL pública tipo `https://practika-xxxx.netlify.app`. ¡Listo, ya es una página real!
5. (Opcional) Crea una cuenta gratis para conservar el sitio y cambiar el nombre del subdominio.

> Es la forma recomendada para usarla **hoy mismo** y compartir el enlace.

---

## 🌐 Opción B — GitHub Pages (gratis, con tu repositorio)

Ya dejé configurado el despliegue automático en `.github/workflows/deploy.yml`.

1. Crea un repositorio en GitHub (ej. `practika`).
2. Sube estos archivos al repo (rama `main`). Si tienes Git:
   ```bash
   git init
   git add .
   git commit -m "PRACTIKA - versión final"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/practika.git
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Cada push a `main` publica el sitio. La URL será `https://TU_USUARIO.github.io/practika/`.

> Si la subes a un subdirectorio (`/practika/`), todo funciona porque las rutas son relativas (`./`).

---

## ▲ Opción C — Vercel

1. Crea cuenta en https://vercel.com e instala la CLI (`npm i -g vercel`) **o** usa "Import Project" desde GitHub.
2. Importa el repositorio o ejecuta `vercel` dentro de la carpeta.
3. Como no hay build, Vercel sirve los archivos tal cual (config en `vercel.json`).

---

## 📱 Instalar como app (PWA)

Una vez publicada (Opción A, B o C), al abrir la URL:
- En **Chrome/Edge (PC)**: aparece el botón **“⬇️ Instalar app”** en el encabezado o el ícono de instalar en la barra de direcciones.
- En **Android/iOS**: menú del navegador → “Agregar a pantalla de inicio”.

La app queda instalada con su ícono, abre a pantalla completa y **funciona sin conexión** (gracias al Service Worker `sw.js`).

---

## 🔌 Probar en local con servidor (opcional)

El Service Worker solo se activa sobre `http/https` (no con doble clic `file://`). Si instalas Python o Node:

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

Luego abre `http://localhost:8080`.

---

## ⏭️ Siguiente nivel (cuando quieras backend real)

Hoy los datos viven en el navegador (`localStorage`). Para multiusuario real:
- Backend **FastAPI + PostgreSQL** (o Node/Express) reemplazando la capa `js/core/store.js` por llamadas a una API REST.
- Pasarela de pagos real (ePayco / Bold / MercadoPago) con cobros recurrentes.
- Hosting del backend en **AWS / Google Cloud** (serverless).
