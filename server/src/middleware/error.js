/* ============================================================
   PRACTIKA API · middleware/error.js
   Manejo centralizado de errores y 404.
   ============================================================ */
export function notFound(_req, res) {
  res.status(404).json({ error: "Ruta no encontrada" });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || "Error interno" });
}
