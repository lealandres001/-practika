/* ============================================================
   PRACTIKA API · controllers/admin.controller.js
   KPIs, predicción, operadores y zonas.
   ============================================================ */
import { MetricsService } from "../services/metrics.service.js";
import { PredictionService } from "../services/prediction.service.js";
import { RoutingService } from "../services/routing.service.js";
import { reset } from "../data/db.js";

export const AdminController = {
  metrics(_req, res) {
    res.json({
      summary: MetricsService.summary(),
      demandByCategory: MetricsService.demandByCategory()
    });
  },

  prediction(_req, res) {
    res.json({
      forecast: PredictionService.forecast(),
      provisioning: PredictionService.operatorProvisioning()
    });
  },

  operators(_req, res) { res.json(RoutingService.operators()); },
  zones(_req, res)     { res.json(RoutingService.zones()); },

  reset(_req, res) {
    reset();
    res.json({ ok: true, message: "Base de datos reiniciada." });
  }
};
