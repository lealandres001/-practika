/* ============================================================
   PRACTIKA · services/routing.service.js  [FASE 2]
   Enrutamiento inteligente: asigna el pedido al operador
   certificado más cercano con capacidad disponible.
   ============================================================ */
window.PRACTIKA = window.PRACTIKA || {};

PRACTIKA.RoutingService = {
  operators() { return PRACTIKA.Store.table("operators"); },
  zones()     { return PRACTIKA.Store.table("zones"); },

  zoneById(id) { return this.zones().find(z => z.id === id) || null; },
  operatorById(id) { return this.operators().find(o => o.id === id) || null; },

  /** Distancia Haversine en km entre dos coordenadas. */
  distanceKm(a, b) {
    const R = 6371;
    const dLat = this._rad(b.lat - a.lat);
    const dLng = this._rad(b.lng - a.lng);
    const lat1 = this._rad(a.lat);
    const lat2 = this._rad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 +
              Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return R * 2 * Math.asin(Math.sqrt(h));
  },
  _rad(deg) { return (deg * Math.PI) / 180; },

  /**
   * Encuentra el operador óptimo para una zona de entrega.
   * Criterio: certificado + con capacidad libre + menor distancia.
   * @returns {{operator, distanceKm}|null}
   */
  assign(zoneId) {
    const zone = this.zoneById(zoneId);
    if (!zone) return null;

    const candidates = this.operators()
      .filter(o => o.certified && o.load < o.capacity)
      .map(o => ({ operator: o, distanceKm: this.distanceKm(zone, o) }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return candidates[0] || null;
  },

  /** Incrementa la carga del operador asignado. */
  addLoad(operatorId) {
    const ops = this.operators();
    const op = ops.find(o => o.id === operatorId);
    if (op && op.load < op.capacity) {
      op.load += 1;
      PRACTIKA.Store.set("operators", ops);
    }
  },

  /** Libera carga cuando un pedido se entrega. */
  releaseLoad(operatorId) {
    const ops = this.operators();
    const op = ops.find(o => o.id === operatorId);
    if (op && op.load > 0) {
      op.load -= 1;
      PRACTIKA.Store.set("operators", ops);
    }
  }
};
