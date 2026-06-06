/* ============================================================
   PRACTIKA · core/gateway.js
   Capa de datos asíncrona. Decide en tiempo de ejecución entre:
     • BACKEND (server/) cuando la API responde  -> multiusuario
     • LOCAL (localStorage) cuando no hay servidor -> demo offline
   Las vistas SIEMPRE llaman a este gateway (async); no les
   importa de dónde vienen los datos.
   ============================================================ */
window.PRACTIKA = window.PRACTIKA || {};

PRACTIKA.Gateway = (function () {
  let online = false;

  /** Comprueba si el backend está disponible (con timeout corto). */
  async function init() {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 1500);
      const res = await fetch(PRACTIKA.Api.base + "/health", { signal: ctrl.signal });
      clearTimeout(t);
      online = res.ok;
    } catch (_) {
      online = false;
    }
    return online;
  }

  function isOnline() { return online; }

  /** Expande un pedido local con objetos zona/operador (como hace la API). */
  function expand(o) {
    return {
      ...o,
      zone: o.zone_id ? PRACTIKA.RoutingService.zoneById(o.zone_id) : null,
      operator: o.operator_id ? PRACTIKA.RoutingService.operatorById(o.operator_id) : null
    };
  }

  return {
    init,
    isOnline,
    mode() { return online ? "servidor" : "local"; },

    // ---- Pedidos (dinámicos / compartidos) ----
    async orders() {
      return online ? PRACTIKA.Api.orders() : PRACTIKA.OrderService.all().map(expand);
    },

    async createOrder(payload) {
      if (online) {
        const order = await PRACTIKA.Api.createOrder(payload);
        PRACTIKA.CartService.clear();
        return order;
      }
      const order = PRACTIKA.OrderService.checkout({
        mode: payload.mode,
        delivery_day: payload.delivery_day,
        delivery_slot: payload.delivery_slot,
        zone_id: payload.zone_id,
        customer: payload.customer
      });
      return expand(order);
    },

    async advanceOrder(id) {
      return online ? PRACTIKA.Api.advanceOrder(id) : expand(PRACTIKA.OrderService.advance(id));
    },

    async saveTrace(id, data) {
      return online ? PRACTIKA.Api.saveTrace(id, data) : expand(PRACTIKA.OrderService.saveTraceability(id, data));
    },

    // ---- Operadores / zonas ----
    async operators() {
      return online ? PRACTIKA.Api.operators() : PRACTIKA.RoutingService.operators();
    },
    async zones() {
      return online ? PRACTIKA.Api.zones() : PRACTIKA.RoutingService.zones();
    },

    // ---- Métricas / IA ----
    async metrics() {
      if (online) return PRACTIKA.Api.metrics();
      return {
        summary: PRACTIKA.MetricsService.summary(),
        demandByCategory: PRACTIKA.MetricsService.demandByCategory()
      };
    },
    async prediction() {
      if (online) return PRACTIKA.Api.prediction();
      return {
        forecast: PRACTIKA.PredictionService.forecast(),
        provisioning: PRACTIKA.PredictionService.operatorProvisioning()
      };
    },

    async reset() {
      return online ? PRACTIKA.Api.reset() : (PRACTIKA.Store.reset(), { ok: true });
    }
  };
})();
