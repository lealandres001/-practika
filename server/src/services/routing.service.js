/* ============================================================
   PRACTIKA API · services/routing.service.js  [FASE 2]
   Enrutamiento: asigna el operador certificado más cercano
   con capacidad disponible (distancia Haversine).
   ============================================================ */
import { operatorRepo, zoneRepo } from "../repositories/index.js";

const rad = (deg) => (deg * Math.PI) / 180;

export const RoutingService = {
  operators() { return operatorRepo.all(); },
  zones()     { return zoneRepo.all(); },
  zoneById(id)     { return zoneRepo.findById(Number(id)); },
  operatorById(id) { return operatorRepo.findById(Number(id)); },

  distanceKm(a, b) {
    const R = 6371;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 +
      Math.sin(dLng / 2) ** 2 * Math.cos(rad(a.lat)) * Math.cos(rad(b.lat));
    return R * 2 * Math.asin(Math.sqrt(h));
  },

  /** Mejor operador para una zona: certificado + con cupo + más cercano. */
  assign(zoneId) {
    const zone = this.zoneById(zoneId);
    if (!zone) return null;
    const candidates = this.operators()
      .filter((o) => o.certified && o.load < o.capacity)
      .map((o) => ({ operator: o, distanceKm: this.distanceKm(zone, o) }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
    return candidates[0] || null;
  },

  addLoad(operatorId) {
    const op = this.operatorById(operatorId);
    if (op && op.load < op.capacity) { op.load += 1; operatorRepo.save(); }
  },

  releaseLoad(operatorId) {
    const op = this.operatorById(operatorId);
    if (op && op.load > 0) { op.load -= 1; operatorRepo.save(); }
  }
};
