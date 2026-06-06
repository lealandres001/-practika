/* ============================================================
   PRACTIKA API · controllers/catalog.controller.js
   ============================================================ */
import { CatalogService } from "../services/catalog.service.js";

export const CatalogController = {
  categories(_req, res) { res.json(CatalogService.categories()); },

  products(req, res) {
    res.json(CatalogService.products(req.query.category));
  },

  product(req, res) {
    const p = CatalogService.productById(req.params.id);
    if (!p) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(p);
  },

  plans(_req, res) {
    res.json(CatalogService.plans().map((p) => ({
      ...p,
      final_price: CatalogService.planFinalPrice(p)
    })));
  },

  courses(_req, res) { res.json(CatalogService.courses()); }
};
