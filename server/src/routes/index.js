/* ============================================================
   PRACTIKA API · routes/index.js
   Define todos los endpoints REST bajo /api.
   ============================================================ */
import { Router } from "express";
import { CatalogController } from "../controllers/catalog.controller.js";
import { OrderController } from "../controllers/order.controller.js";
import { AdminController } from "../controllers/admin.controller.js";

export const router = Router();

// Salud
router.get("/health", (_req, res) => res.json({ status: "ok", service: "practika-api" }));

// Catálogo (Fase 1)
router.get("/categories", CatalogController.categories);
router.get("/products", CatalogController.products);
router.get("/products/:id", CatalogController.product);
router.get("/plans", CatalogController.plans);
router.get("/courses", CatalogController.courses);

// Pedidos (Fases 1-2)
router.get("/orders", OrderController.list);
router.get("/orders/:id", OrderController.get);
router.post("/orders", OrderController.create);
router.post("/orders/:id/advance", OrderController.advance);
router.patch("/orders/:id/traceability", OrderController.traceability);

// Administración / IA (Fases 1-3)
router.get("/admin/metrics", AdminController.metrics);
router.get("/admin/prediction", AdminController.prediction);
router.get("/operators", AdminController.operators);
router.get("/zones", AdminController.zones);
router.post("/admin/reset", AdminController.reset);
