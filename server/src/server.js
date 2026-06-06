/* ============================================================
   PRACTIKA API · server.js
   Punto de entrada. Inicializa el almacenamiento y levanta HTTP.
   ============================================================ */
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { initStorage } from "./data/db.js";

async function main() {
  await initStorage(); // file o postgres según .env

  const app = createApp();

  app.listen(env.port, () => {
    console.log("============================================");
    console.log("  PRACTIKA API en marcha 🍳");
    console.log(`  Web:  http://localhost:${env.port}/`);
    console.log(`  API:  http://localhost:${env.port}/api/health`);
    console.log(`  Datos: ${env.storage}`);
    console.log("============================================");
  });
}

main().catch((e) => {
  console.error("❌ No se pudo iniciar el servidor:", e);
  process.exit(1);
});
