# ✅ Despliegue paso a paso — PRACTIKA (app completa multiusuario)

Objetivo: dejar la app pública con backend + PostgreSQL en **Render** (plan gratis).
Tiempo aprox: 20-30 min la primera vez.

Marca cada paso al completarlo. Si algo falla, copia el mensaje de error y pídeme ayuda.

---

## PASO 1 — Instalar Git  ☐
1. Descarga: https://git-scm.com/download/win
2. Instala con las opciones por defecto (Next, Next… Finish).
3. **Cierra y vuelve a abrir** cualquier terminal/editor para que reconozca `git`.
4. Verifica abriendo una terminal y escribiendo:
   ```
   git --version
   ```
   Debe mostrar algo como `git version 2.4x.x`.

---

## PASO 2 — Crear cuenta en GitHub  ☐
1. Entra a https://github.com y regístrate (gratis) si no tienes cuenta.
2. Verifica tu correo.

---

## PASO 3 — Crear el repositorio en GitHub  ☐
1. En GitHub: botón **+** (arriba derecha) → **New repository**.
2. Repository name: `practika`
3. Déjalo **Public** (o Private, da igual para Render).
4. **NO** marques "Add a README" (ya tenemos uno).
5. Click **Create repository**.
6. Copia la URL que te muestra, será algo como:
   `https://github.com/TU_USUARIO/practika.git`

---

## PASO 4 — Subir el proyecto a GitHub  ☐
Abre una terminal **dentro de la carpeta del proyecto** y ejecuta una por una:

```
cd C:\Users\HP\Desktop\prueba1
git init
git add .
git commit -m "PRACTIKA - app completa (web + backend + postgres)"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/practika.git
git push -u origin main
```

> Reemplaza `TU_USUARIO` por tu usuario real de GitHub.
> La primera vez te pedirá iniciar sesión en GitHub (se abre una ventana del navegador). Acepta.

Al terminar, recarga tu repo en GitHub: deberías ver todos los archivos.

---

## PASO 5 — Crear cuenta en Render  ☐
1. Entra a https://render.com
2. **Get Started** → regístrate con **GitHub** (botón "Sign in with GitHub").
3. Autoriza a Render a ver tus repositorios.

---

## PASO 6 — Desplegar con el Blueprint  ☐
1. En Render: **New** (arriba) → **Blueprint**.
2. Selecciona tu repositorio `practika` → **Connect**.
3. Render detecta el archivo `render.yaml` automáticamente.
4. (Opcional pero recomendado) Para datos PERMANENTES con PostgreSQL,
   ve al PASO 7 ANTES de darle Apply. Si solo quieres probar ya, dale **Apply**.
5. Espera 2-3 min. Cuando el estado sea **Live**, tendrás una URL como:
   `https://practika.onrender.com`
6. Ábrela: verás la app. Comprueba también:
   `https://practika.onrender.com/api/health`

---

## PASO 7 — (Recomendado) Activar PostgreSQL permanente  ☐
Sin esto, los datos se reinician cada vez que el servidor "duerme" (plan free).

**Opción simple (desde el panel de Render):**
1. Render → **New** → **PostgreSQL** → nombre `practika-db`, plan **Free** → **Create**.
2. Cuando esté listo, entra a la base y copia el **Internal Database URL**.
3. Ve a tu servicio web `practika` → pestaña **Environment** → **Add Environment Variable**:
   - `STORAGE` = `postgres`
   - `DATABASE_URL` = (pega el Internal Database URL copiado)
4. **Save Changes**. Render reinicia el servicio. ¡Listo, datos permanentes!

---

## ✅ PRUEBA FINAL — Multiusuario
1. Abre tu URL pública en el **celular** y en el **PC** a la vez.
2. En uno: rol **Cliente** → crea un pedido (suscríbete + paga).
3. En el otro: rol **Operador** y **Administrador** → debe aparecer el pedido.
4. El indicador del encabezado debe decir **● En línea**.

Si todo eso pasa: ¡tu app está desplegada y es multiusuario real! 🎉

---

### Notas
- Plan free de Render "duerme" tras inactividad; la primera visita tras dormir tarda ~30s en despertar. Es normal.
- Para que el sitio no duerma o tenga más recursos, se sube de plan cuando haya tráfico real.
- ¿Errores en el build/deploy? Copia el log de la pestaña **Logs** de Render y compártelo.
