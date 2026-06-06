/* ============================================================
   PRACTIKA · services/catalog.service.js
   Lógica de negocio del catálogo y planes.
   ============================================================ */
window.PRACTIKA = window.PRACTIKA || {};

PRACTIKA.CatalogService = {
  categories() {
    return PRACTIKA.Store.table("categories");
  },

  plans() {
    return PRACTIKA.Store.table("plans");
  },

  /** Todos los productos, o filtrados por slug de categoría. */
  products(categorySlug) {
    const products = PRACTIKA.Store.table("products");
    if (!categorySlug) return products;
    const cat = this.categories().find(c => c.slug === categorySlug);
    if (!cat) return products;
    return products.filter(p => p.category_id === cat.id);
  },

  productById(id) {
    return PRACTIKA.Store.table("products").find(p => p.id === id) || null;
  },

  categoryById(id) {
    return this.categories().find(c => c.id === id) || null;
  },

  planById(id) {
    return this.plans().find(p => p.id === id) || null;
  },

  /** Precio final de un plan tras aplicar su descuento. */
  planFinalPrice(plan) {
    return Math.round(plan.price_cop * (1 - plan.discount_pct / 100));
  }
};
