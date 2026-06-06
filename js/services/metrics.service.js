/* ============================================================
   PRACTIKA · services/metrics.service.js
   KPIs para el panel de administración (Fase 1).
   ============================================================ */
window.PRACTIKA = window.PRACTIKA || {};

PRACTIKA.MetricsService = {
  summary() {
    const orders = PRACTIKA.OrderService.all();
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const subs = orders.filter(o => o.type === "subscription");
    const subscriptionRate = orders.length
      ? Math.round((subs.length / orders.length) * 100)
      : 0;
    const avgTicket = orders.length ? Math.round(revenue / orders.length) : 0;
    const mrr = subs.reduce((s, o) => s + o.total, 0); // ingreso recurrente mensual estimado

    return {
      totalOrders: orders.length,
      revenue,
      mrr,
      subscriptions: subs.length,
      subscriptionRate,
      avgTicket
    };
  },

  /** Volumen de pedidos por categoría (para futura predicción de demanda). */
  demandByCategory() {
    const counts = {};
    PRACTIKA.CatalogService.categories().forEach(c => (counts[c.name] = 0));
    PRACTIKA.OrderService.all().forEach(o => {
      o.items.forEach(it => {
        const p = PRACTIKA.CatalogService.productById(it.product_id);
        if (!p) return;
        const cat = PRACTIKA.CatalogService.categoryById(p.category_id);
        if (cat) counts[cat.name] += it.qty;
      });
    });
    return counts;
  }
};
