/* ============================================================
   PRACTIKA · services/order.service.js
   Creación y ciclo de vida de pedidos + checkout simulado.
   Estados: pendiente -> preparacion -> listo -> entregado
   ============================================================ */
window.PRACTIKA = window.PRACTIKA || {};

PRACTIKA.OrderService = {
  STATUSES: ["pendiente", "preparacion", "listo", "entregado"],

  SUBSCRIPTION_DISCOUNT: 0.10, // 10% por suscripción mensual recurrente

  all() {
    return PRACTIKA.Store.table("orders");
  },

  byId(id) {
    return this.all().find(o => o.id === id) || null;
  },

  /** Total tras aplicar descuento de suscripción si corresponde. */
  computeTotal(subtotal, mode) {
    return mode === "subscription"
      ? Math.round(subtotal * (1 - this.SUBSCRIPTION_DISCOUNT))
      : subtotal;
  },

  /**
   * Crea un pedido a partir del carrito actual.
   * @returns {object} el pedido creado.
   */
  checkout({ mode, delivery_day, delivery_slot, zone_id, customer }) {
    const lines = PRACTIKA.CartService.detailed();
    if (lines.length === 0) throw new Error("El carrito está vacío.");

    const subtotal = PRACTIKA.CartService.subtotal();
    const total = this.computeTotal(subtotal, mode);

    // [FASE 2] Enrutamiento: asignar operador certificado más cercano
    const assignment = PRACTIKA.RoutingService.assign(zone_id);
    const operator = assignment ? assignment.operator : null;

    const order = {
      id: PRACTIKA.Store.nextOrderId(),
      user_id: PRACTIKA.State.currentUser.id,
      user_name: customer.name,
      customer_email: customer.email,
      customer_address: customer.address,
      type: mode, // subscription | single
      items: lines.map(li => ({ product_id: li.product_id, qty: li.qty })),
      subtotal,
      total,
      zone_id,
      operator_id: operator ? operator.id : null,
      assignment_distance: assignment ? Number(assignment.distanceKm.toFixed(2)) : null,
      traceability: { lot: "", weight: "", vacuum_ok: false },
      delivery_day,
      delivery_slot,
      status: "pendiente",
      payment_status: "pagado", // pasarela simulada aprueba el cobro
      created_at: new Date().toISOString()
    };

    const orders = this.all();
    orders.unshift(order);
    PRACTIKA.Store.set("orders", orders);
    if (operator) PRACTIKA.RoutingService.addLoad(operator.id);
    PRACTIKA.CartService.clear();
    return order;
  },

  /** Avanza el pedido al siguiente estado del flujo operativo. */
  advance(id) {
    const order = this.byId(id);
    if (!order) return null;
    const idx = this.STATUSES.indexOf(order.status);
    if (idx < this.STATUSES.length - 1) {
      order.status = this.STATUSES[idx + 1];
      // Al entregar, libera la capacidad del operador
      if (order.status === "entregado" && order.operator_id) {
        PRACTIKA.RoutingService.releaseLoad(order.operator_id);
      }
      PRACTIKA.Store.set("orders", this.all());
    }
    return order;
  },

  /** Guarda los datos de trazabilidad del lote (Fase 2). */
  saveTraceability(id, data) {
    const order = this.byId(id);
    if (!order) return null;
    order.traceability = { ...order.traceability, ...data };
    PRACTIKA.Store.set("orders", this.all());
    return order;
  },

  /** Líneas de un pedido enriquecidas con el producto. */
  detailedItems(order) {
    return order.items.map(it => ({
      ...it,
      product: PRACTIKA.CatalogService.productById(it.product_id)
    })).filter(it => it.product);
  }
};
