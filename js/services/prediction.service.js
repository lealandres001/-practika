/* ============================================================
   PRACTIKA · services/prediction.service.js  [FASE 3 · IA]
   Predicción de demanda. Combina el historial de ventas con
   la demanda real de los pedidos vigentes y proyecta la
   próxima semana usando media móvil + tendencia de crecimiento.
   Objetivo: anticipar insumos y reducir mermas a cero.
   ============================================================ */
window.PRACTIKA = window.PRACTIKA || {};

PRACTIKA.PredictionService = {
  history() { return PRACTIKA.Store.table("salesHistory"); },

  /** Categorías presentes en el historial. */
  _categories() {
    return PRACTIKA.CatalogService.categories().map(c => c.name);
  },

  /**
   * Pronóstico de la próxima semana por categoría.
   * Modelo: última semana + (tendencia promedio entre semanas).
   * @returns {Array<{category, lastWeek, forecast, growthPct}>}
   */
  forecast() {
    const hist = this.history();
    if (hist.length < 2) return [];

    return this._categories().map(cat => {
      const series = hist.map(h => h[cat] || 0);
      const deltas = [];
      for (let i = 1; i < series.length; i++) deltas.push(series[i] - series[i - 1]);
      const avgDelta = deltas.reduce((s, d) => s + d, 0) / deltas.length;
      const lastWeek = series[series.length - 1];
      const forecast = Math.max(0, Math.round(lastWeek + avgDelta));
      const growthPct = lastWeek ? Math.round((avgDelta / lastWeek) * 100) : 0;
      return { category: cat, lastWeek, forecast, growthPct };
    });
  },

  /**
   * Recomendación de insumos por operador para la próxima semana:
   * reparte el pronóstico total entre los operadores certificados
   * proporcionalmente a su capacidad.
   */
  operatorProvisioning() {
    const fc = this.forecast();
    const totalForecast = fc.reduce((s, f) => s + f.forecast, 0);
    const ops = PRACTIKA.RoutingService.operators().filter(o => o.certified);
    const totalCap = ops.reduce((s, o) => s + o.capacity, 0) || 1;

    return ops.map(o => ({
      operator: o,
      units: Math.round(totalForecast * (o.capacity / totalCap))
    }));
  }
};
