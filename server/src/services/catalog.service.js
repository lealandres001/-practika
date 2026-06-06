/* ============================================================
   PRACTIKA API · services/catalog.service.js
   ============================================================ */
import { categoryRepo, productRepo, planRepo, courseRepo } from "../repositories/index.js";

export const CatalogService = {
  categories() { return categoryRepo.all(); },
  courses()    { return courseRepo.all(); },
  plans()      { return planRepo.all(); },

  products(categorySlug) {
    if (!categorySlug) return productRepo.all();
    const cat = categoryRepo.find((c) => c.slug === categorySlug)[0];
    if (!cat) return [];
    return productRepo.find((p) => p.category_id === cat.id);
  },

  productById(id)  { return productRepo.findById(Number(id)); },
  categoryById(id) { return categoryRepo.findById(Number(id)); },
  planById(id)     { return planRepo.findById(Number(id)); },

  planFinalPrice(plan) {
    return Math.round(plan.price_cop * (1 - plan.discount_pct / 100));
  }
};
