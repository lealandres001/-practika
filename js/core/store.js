/* ============================================================
   PRACTIKA · core/store.js
   Capa de persistencia. Simula la base de datos usando
   localStorage. Aísla el resto de la app del mecanismo de
   almacenamiento (mañana podría ser una API REST contra
   PostgreSQL sin tocar servicios).
   ============================================================ */
window.PRACTIKA = window.PRACTIKA || {};

PRACTIKA.Store = (function () {
  const KEY = "practika_db_v2";

  // Estructura inicial sembrada desde el SEED
  function defaults() {
    return {
      categories: PRACTIKA.SEED.categories,
      products: PRACTIKA.SEED.products,
      plans: PRACTIKA.SEED.plans,
      zones: PRACTIKA.SEED.zones,
      operators: PRACTIKA.SEED.operators.map(o => ({ ...o })),
      courses: PRACTIKA.SEED.courses,
      salesHistory: PRACTIKA.SEED.salesHistory,
      orders: PRACTIKA.SEED.demoOrders.map(o => ({ ...o })),
      cart: [],          // [{ product_id, qty }]
      checklists: {},    // { orderId: [bool,...] }
      seq: 1003          // contador de pedidos (PR-1003, ...)
    };
  }

  let db = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        const fresh = defaults();
        localStorage.setItem(KEY, JSON.stringify(fresh));
        return fresh;
      }
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Store: no se pudo leer localStorage, usando memoria.", e);
      return defaults();
    }
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch (e) {
      console.warn("Store: no se pudo persistir.", e);
    }
  }

  return {
    /** Devuelve una colección completa (array u objeto). */
    table(name) { return db[name]; },

    /** Reemplaza una colección y persiste. */
    set(name, value) { db[name] = value; persist(); },

    /** Lee un valor escalar. */
    get(name) { return db[name]; },

    /** Incrementa el contador de pedidos y devuelve el nuevo id legible. */
    nextOrderId() { db.seq += 1; persist(); return "PR-" + db.seq; },

    /** Reinicia la base de datos al estado sembrado. */
    reset() { db = defaults(); persist(); }
  };
})();
