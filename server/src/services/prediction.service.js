/* ============================================================
   PRACTIKA API · services/prediction.service.js  [FASE 3 · IA]
   Pronóstico de demanda: media móvil + tendencia.
   ============================================================ */
import { historyRepo } from "../repositories/index.js";
import { CatalogService } from "./catalog.service.js";
import { RoutingService } from "./routing.service.js";

export const PredictionService = {
  forecast() {
    const hist = historyRepo.all();
    if (hist.length < 2) return [];
    return CatalogService.categories().map((c) => {
      const cat = c.name;
      const series = hist.map((h) => h[cat] || 0);
      const deltas = [];
      for (let i = 1; i < series.length; i++) deltas.push(series[i] - series[i - 1]);
      const avgDelta = deltas.reduce((s, d) => s + d, 0) / deltas.length;
      const lastWeek = series[series.length - 1];
      const forecast = Math.max(0, Math.round(lastWeek + avgDelta));
      const growthPct = lastWeek ? Math.round((avgDelta / lastWeek) * 100) : 0;
      return { category: cat, lastWeek, forecast, growthPct };
    });
  },

  operatorProvisioning() {
    const fc = this.forecast();
    const totalForecast = fc.reduce((s, f) => s + f.forecast, 0);
    const ops = RoutingService.operators().filter((o) => o.certified);
    const totalCap = ops.reduce((s, o) => s + o.capacity, 0) || 1;
    return ops.map((o) => ({
      operator: o,
      units: Math.round(totalForecast * (o.capacity / totalCap))
    }));
  }
};
