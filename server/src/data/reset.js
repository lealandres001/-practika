/* ============================================================
   PRACTIKA API · data/reset.js
   Script de re-siembra. Uso: npm run seed
   ============================================================ */
import { initStorage, reset, flush } from "./db.js";

await initStorage();
reset();
await flush();
console.log("✅ Base de datos reiniciada con datos semilla.");
process.exit(0);
