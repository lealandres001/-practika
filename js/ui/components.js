/* ============================================================
   PRACTIKA · ui/components.js
   Helpers de render compartidos por las vistas.
   ============================================================ */
window.PRACTIKA = window.PRACTIKA || {};

PRACTIKA.UI = {
  /** Escapa texto para evitar inyección en innerHTML. */
  esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },

  /** Tarjeta de producto. */
  productCard(p) {
    const cat = PRACTIKA.CatalogService.categoryById(p.category_id);
    const vacuum = p.vacuum_packed
      ? `<span class="tag-vacuum">🫙 Al vacío</span>` : "";
    return `
      <article class="card">
        <div class="card-emoji">${p.emoji}</div>
        <div class="card-body">
          <span class="card-cat">${this.esc(cat ? cat.name : "")}</span>
          <h3 class="card-title">${this.esc(p.name)}</h3>
          <p class="card-desc">${this.esc(p.description)}</p>
          <div class="card-meta">
            <small class="muted">${this.esc(p.unit)}</small> ${vacuum}
          </div>
        </div>
        <div class="card-foot">
          <span class="price">${PRACTIKA.fmt.cop(p.price_cop)}</span>
          <button class="btn btn-primary btn-sm" data-add="${p.id}">Agregar</button>
        </div>
      </article>`;
  },

  /** Tarjeta de plan de suscripción. */
  planCard(plan) {
    const finalPrice = PRACTIKA.CatalogService.planFinalPrice(plan);
    const productNames = plan.items
      .map(id => PRACTIKA.CatalogService.productById(id))
      .filter(Boolean)
      .map(p => `${p.emoji} ${this.esc(p.name)}`)
      .join(" · ");
    return `
      <article class="card">
        <div class="card-emoji">📦</div>
        <div class="card-body">
          <span class="card-cat">Suscripción mensual <span class="badge-save">-${plan.discount_pct}%</span></span>
          <h3 class="card-title">${this.esc(plan.name)}</h3>
          <p class="card-desc">${this.esc(plan.description)}</p>
          <p class="card-desc"><strong>Incluye:</strong> ${productNames}</p>
        </div>
        <div class="card-foot">
          <span class="price">${PRACTIKA.fmt.cop(finalPrice)} <small>/mes</small></span>
          <button class="btn btn-amber btn-sm" data-plan="${plan.id}">Suscribirme</button>
        </div>
      </article>`;
  }
};
