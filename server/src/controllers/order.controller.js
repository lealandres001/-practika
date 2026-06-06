/* ============================================================
   PRACTIKA API · controllers/order.controller.js
   ============================================================ */
import { OrderService } from "../services/order.service.js";
import { RoutingService } from "../services/routing.service.js";

/** Enriquece un pedido con datos legibles de zona/operador. */
function expand(order) {
  const zone = order.zone_id ? RoutingService.zoneById(order.zone_id) : null;
  const operator = order.operator_id ? RoutingService.operatorById(order.operator_id) : null;
  return { ...order, zone, operator };
}

export const OrderController = {
  list(_req, res) {
    res.json(OrderService.all().map(expand));
  },

  get(req, res) {
    const o = OrderService.byId(req.params.id);
    if (!o) return res.status(404).json({ error: "Pedido no encontrado" });
    res.json(expand(o));
  },

  create(req, res, next) {
    try {
      res.status(201).json(expand(OrderService.create(req.body)));
    } catch (e) { next(e); }
  },

  advance(req, res, next) {
    try {
      res.json(expand(OrderService.advance(req.params.id)));
    } catch (e) { next(e); }
  },

  traceability(req, res, next) {
    try {
      res.json(expand(OrderService.saveTraceability(req.params.id, req.body)));
    } catch (e) { next(e); }
  }
};
