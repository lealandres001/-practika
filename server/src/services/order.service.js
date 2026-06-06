/* ============================================================
   PRACTIKA API · services/order.service.js
   Creación y ciclo de vida de pedidos. Aplica enrutamiento y
   descuento de suscripción. Valida la entrada.
   ============================================================ */
import { orderRepo } from "../repositories/index.js";
import { nextOrderId } from "../data/db.js";
import { CatalogService } from "./catalog.service.js";
import { RoutingService } from "./routing.service.js";

const STATUSES = ["pendiente", "preparacion", "listo", "entregado"];
const SUBSCRIPTION_DISCOUNT = 0.10;

export const OrderService = {
  STATUSES,

  all() { return orderRepo.all(); },
  byId(id) { return orderRepo.find((o) => o.id === id)[0] || null; },

  computeTotal(subtotal, mode) {
    return mode === "subscription"
      ? Math.round(subtotal * (1 - SUBSCRIPTION_DISCOUNT))
      : subtotal;
  },

  detailedItems(order) {
    return order.items
      .map((it) => ({ ...it, product: CatalogService.productById(it.product_id) }))
      .filter((it) => it.product);
  },

  /** Crea un pedido validando productos, modo, zona y entrega. */
  create(payload) {
    const { mode, items, zone_id, delivery_day, delivery_slot, customer } = payload;

    if (!["subscription", "single"].includes(mode)) {
      throw httpError(400, "Modo inválido (subscription | single).");
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw httpError(400, "El pedido no tiene productos.");
    }
    if (!customer || !customer.name || !customer.email) {
      throw httpError(400, "Faltan datos del cliente (name, email).");
    }

    // Normaliza líneas y calcula subtotal con precios reales del servidor
    let subtotal = 0;
    const lines = items.map((it) => {
      const product = CatalogService.productById(it.product_id);
      if (!product) throw httpError(400, `Producto inexistente: ${it.product_id}`);
      const qty = Math.max(1, Number(it.qty) || 1);
      subtotal += product.price_cop * qty;
      return { product_id: product.id, qty };
    });

    const total = this.computeTotal(subtotal, mode);
    const assignment = zone_id ? RoutingService.assign(zone_id) : null;
    const operator = assignment ? assignment.operator : null;

    const order = {
      id: nextOrderId(),
      user_id: customer.id || null,
      user_name: customer.name,
      customer_email: customer.email,
      customer_address: customer.address || "",
      type: mode,
      items: lines,
      subtotal,
      total,
      zone_id: zone_id || null,
      operator_id: operator ? operator.id : null,
      assignment_distance: assignment ? Number(assignment.distanceKm.toFixed(2)) : null,
      traceability: { lot: "", weight: "", vacuum_ok: false },
      delivery_day: delivery_day || null,
      delivery_slot: delivery_slot || null,
      status: "pendiente",
      payment_status: "pagado",
      created_at: new Date().toISOString()
    };

    orderRepo.insert(order);
    if (operator) RoutingService.addLoad(operator.id);
    return order;
  },

  advance(id) {
    const order = this.byId(id);
    if (!order) throw httpError(404, "Pedido no encontrado.");
    const idx = STATUSES.indexOf(order.status);
    if (idx < STATUSES.length - 1) {
      order.status = STATUSES[idx + 1];
      if (order.status === "entregado" && order.operator_id) {
        RoutingService.releaseLoad(order.operator_id);
      }
      orderRepo.save();
    }
    return order;
  },

  saveTraceability(id, data) {
    const order = this.byId(id);
    if (!order) throw httpError(404, "Pedido no encontrado.");
    order.traceability = { ...order.traceability, ...data };
    orderRepo.save();
    return order;
  }
};

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}
