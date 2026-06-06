/* ============================================================
   PRACTIKA API · config/env.js
   Carga de variables de entorno sin dependencias externas.
   Lee process.env y aplica valores por defecto sensatos.
   ============================================================ */
export const env = {
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN || "*",
  storage: process.env.STORAGE || "file",
  databaseUrl: process.env.DATABASE_URL || ""
};
