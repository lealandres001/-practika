/* ============================================================
   PRACTIKA API · services/metrics.service.js
   ============================================================ */
import { OrderService } from "./order.service.js";
import { CatalogService } from "./catalog.service.js";

export const MetricsService = {
  summary() {
    const orders = OrderService.all();
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const subs = orders.filter((o) => o.type === "subscription");
    return {
      totalOrders: orders.length,
      revenue,
      mrr: subs.reduce((s, o) => s + o.total, 0),
      subscriptions: subs.length,
      subscriptionRate: orders.length ? Math.round((subs.length / orders.length) * 100) : 0,
      avgTicket: orders.length ? Math.round(revenue / orders.length) : 0
    };
  },

  demandByCategory() {
    const counts = {};
    CatalogService.categories().forEach((c) => (counts[c.name] = 0));
    OrderService.all().forEach((o) =>
      o.items.forEach((it) => {
        const p = CatalogService.productById(it.product_id);
        if (!p) return;
        const cat = CatalogService.categoryById(p.category_id);
        if (cat) counts[cat.name] += it.qty;
      })
    );
    return counts;
  }
};
