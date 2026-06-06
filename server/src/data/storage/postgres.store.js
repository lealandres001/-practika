/* ============================================================
   PRACTIKA API · data/storage/postgres.store.js
   Adaptador de almacenamiento sobre PostgreSQL.
   Persiste el estado de la app como documento JSONB en la tabla
   practika_state (id=1). Permanente entre reinicios y deploys.
   El paquete "pg" se importa de forma diferida: solo se usa
   cuando STORAGE=postgres.
   ============================================================ */

/** Determina si la conexión requiere SSL (hosts gestionados sí, local no). */
function needsSsl(url) {
  return !/localhost|127\.0\.0\.1/.test(url || "");
}

export function createStore(databaseUrl) {
  if (!databaseUrl) {
    throw new Error("STORAGE=postgres requiere DATABASE_URL en el entorno.");
  }

  let pool = null;

  async function getPool() {
    if (pool) return pool;
    const pg = (await import("pg")).default;
    pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: needsSsl(databaseUrl) ? { rejectUnauthorized: false } : false
    });
    await pool.query(
      "CREATE TABLE IF NOT EXISTS practika_state (id INTEGER PRIMARY KEY, data JSONB NOT NULL)"
    );
    return pool;
  }

  return {
    /** Carga el estado o null si aún no existe. */
    async load() {
      const p = await getPool();
      const r = await p.query("SELECT data FROM practika_state WHERE id = 1");
      return r.rows[0] ? r.rows[0].data : null;
    },

    /** Guarda (upsert) el estado completo. */
    async save(cache) {
      const p = await getPool();
      await p.query(
        `INSERT INTO practika_state (id, data) VALUES (1, $1)
         ON CONFLICT (id) DO UPDATE SET data = $1`,
        [JSON.stringify(cache)]
      );
    }
  };
}
