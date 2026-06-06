/* ============================================================
   PRACTIKA API · app.js
   Construye la aplicación Express (middlewares + rutas).
   Sirve además el frontend estático de la carpeta raíz para
   que la página y la API vivan en el mismo origen.
   ============================================================ */
import express from "express";
import cors from "cors";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { router } from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/error.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..", "..");

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  // API REST
  app.use("/api", router);

  // Frontend estático (index.html, js, assets…)
  app.use(express.static(WEB_ROOT));

  // 404 + errores (para rutas /api que no existen)
  app.use("/api", notFound);
  app.use(errorHandler);

  return app;
}
