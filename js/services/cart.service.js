/* ============================================================
   PRACTIKA · services/cart.service.js
   Gestión del carrito (líneas, cantidades, totales).
   El carrito vive en el Store para que sobreviva recargas.
   ============================================================ */
window.PRACTIKA = window.PRACTIKA || {};

PRACTIKA.CartService = {
  items() {
    return PRACTIKA.Store.table("cart");
  },

  count() {
    return this.items().reduce((sum, li) => sum + li.qty, 0);
  },

  /** Agrega un producto (o incrementa su cantidad). */
  add(productId, qty = 1) {
    const cart = this.items();
    const line = cart.find(li => li.product_id === productId);
    if (line) {
      line.qty += qty;
    } else {
      cart.push({ product_id: productId, qty });
    }
    PRACTIKA.Store.set("cart", cart);
  },

  /** Agrega de golpe todos los productos de un plan. */
  addPlan(plan) {
    const cart = this.items();
    plan.items.forEach(pid => {
      const line = cart.find(li => li.product_id === pid);
      if (line) line.qty += 1;
      else cart.push({ product_id: pid, qty: 1 });
    });
    PRACTIKA.Store.set("cart", cart);
  },

  setQty(productId, qty) {
    let cart = this.items();
    if (qty <= 0) {
      cart = cart.filter(li => li.product_id !== productId);
    } else {
      const line = cart.find(li => li.product_id === productId);
      if (line) line.qty = qty;
    }
    PRACTIKA.Store.set("cart", cart);
  },

  remove(productId) {
    const cart = this.items().filter(li => li.product_id !== productId);
    PRACTIKA.Store.set("cart", cart);
  },

  clear() {
    PRACTIKA.Store.set("cart", []);
  },

  /** Devuelve líneas enriquecidas con el producto completo. */
  detailed() {
    return this.items().map(li => ({
      ...li,
      product: PRACTIKA.CatalogService.productById(li.product_id)
    })).filter(li => li.product);
  },

  subtotal() {
    return this.detailed().reduce((sum, li) => sum + li.product.price_cop * li.qty, 0);
  }
};
