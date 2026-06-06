/* ============================================================
   PRACTIKA API · data/db.js
   Capa de persistencia con backend intercambiable:
     • file     -> JSON local (server/data/db.json)   [por defecto]
     • postgres -> PostgreSQL (documento JSONB)        [producción]

   Mantiene una API SÍNCRONA (table, nextOrderId, persist, reset)
   para que los servicios no cambien. El estado vive en memoria
   (cache) y se escribe al backend de forma transparente
   (síncrono en file, write-through asíncrono en postgres).
   ============================================================ */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { seedData } from "./seed.js";
import { env } from "../config/env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "..", "data");
const DB_FILE = join(DATA_DIR, "db.json");

let cache = null;
let backend = "file";     // "file" | "postgres"
let pgStore = null;       // adaptador postgres (si aplica)
let writeChain = Promise.resolve(); // serializa escrituras a postgres

/* ---------- Backend de archivo (síncrono) ---------- */
function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}
function fileLoad() {
  ensureDir();
  if (existsSync(DB_FILE)) return JSON.parse(readFileSync(DB_FILE, "utf-8"));
  return null;
}
function fileSave(data) {
  ensureDir();
  writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/* ---------- Inicialización (async) ---------- */
export async function initStorage() {
  if (env.storage === "postgres") {
    backend = "postgres";
    const mod = await import("./storage/postgres.store.js");
    pgStore = mod.createStore(env.databaseUrl);
    cache = await pgStore.load();
    if (!cache) { cache = seedData(); await pgStore.save(cache); }
    console.log("🗄️  Almacenamiento: PostgreSQL");
  } else {
    backend = "file";
    cache = fileLoad();
    if (!cache) { cache = seedData(); fileSave(cache); }
    console.log("🗄️  Almacenamiento: archivo JSON local");
  }
  return cache;
}

/* ---------- Acceso síncrono (usado por repositorios) ---------- */
export function load() {
  // Respaldo para entornos que no llamaron initStorage (modo file).
  if (!cache) { cache = fileLoad() || seedData(); }
  return cache;
}

export function persist() {
  if (!cache) return;
  if (backend === "postgres" && pgStore) {
    // Write-through asíncrono y serializado (best-effort).
    writeChain = writeChain
      .then(() => pgStore.save(cache))
      .catch((e) => console.error("PG save error:", e.message));
  } else {
    fileSave(cache);
  }
}

export function reset() {
  cache = seedData();
  persist();
  return cache;
}

/** Espera a que termine cualquier escritura pendiente (útil en CLI). */
export async function flush() {
  await writeChain;
}

export function table(name) {
  return load()[name];
}

export function nextOrderId() {
  const db = load();
  db.meta.seq += 1;
  persist();
  return "PR-" + db.meta.seq;
}
