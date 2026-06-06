/* ============================================================
   PRACTIKA · ui/catalog.view.js
   Vista del Cliente: hero, planes de suscripción y catálogo
   filtrable por las 4 categorías.
   ============================================================ */
window.PRACTIKA = window.PRACTIKA || {};

PRACTIKA.CatalogView = {
  render() {
    const S = PRACTIKA.State;
    const cats = PRACTIKA.CatalogService.categories();
    const plans = PRACTIKA.CatalogService.plans();
    const products = PRACTIKA.CatalogService.products(S.activeCategory);

    const chips = [
      `<button class="cat-chip ${!S.activeCategory ? "active" : ""}" data-cat="">🍽️ Todo</button>`,
      ...cats.map(c =>
        `<button class="cat-chip ${S.activeCategory === c.slug ? "active" : ""}" data-cat="${c.slug}">${c.emoji} ${PRACTIKA.UI.esc(c.name)}</button>`
      )
    ].join("");

    const planCards = plans.map(p => PRACTIKA.UI.planCard(p)).join("");
    const productCards = products.length
      ? products.map(p => PRACTIKA.UI.productCard(p)).join("")
      : `<div class="empty"><div class="big">🔍</div><p>No hay productos en esta categoría.</p></div>`;

    document.getElementById("view").innerHTML = `
      <section class="hero">
        <h1>Tu cocina, lista para la semana 🍳</h1>
        <p>PRACTIKA prepara, porciona y empaca al vacío lo que necesitas. Recibe kits de alistamiento marinados o cocidos y recupera tu tiempo.</p>
        <div class="pills">
          <span class="pill">✅ Cero mermas</span>
          <span class="pill">🫙 Empaque al vacío</span>
          <span class="pill">🔁 Suscripción mensual</span>
          <span class="pill">🚚 Entrega programada</span>
        </div>
      </section>

      <div class="section-head">
        <h2>Planes de suscripción</h2>
        <p>Suscríbete en 3 clics y ahorra cada mes</p>
      </div>
      <div class="grid">${planCards}</div>

      <div class="section-head">
        <h2>Catálogo por categoría</h2>
        <p>${products.length} producto(s)</p>
      </div>
      <div class="cat-filter">${chips}</div>
      <div class="grid">${productCards}</div>
    `;

    this.bind();
  },

  bind() {
    const view = document.getElementById("view");

    view.querySelectorAll("[data-cat]").forEach(btn => {
      btn.addEventListener("click", () => {
        PRACTIKA.State.activeCategory = btn.dataset.cat || null;
        this.render();
      });
    });

    view.querySelectorAll("[data-add]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.add);
        PRACTIKA.CartService.add(id, 1);
        const p = PRACTIKA.CatalogService.productById(id);
        PRACTIKA.toast(`✅ ${p.name} agregado al carrito`);
        PRACTIKA.App.refreshCartCount();
      });
    });

    view.querySelectorAll("[data-plan]").forEach(btn => {
      btn.addEventListener("click", () => {
        const plan = PRACTIKA.CatalogService.planById(Number(btn.dataset.plan));
        PRACTIKA.CartService.addPlan(plan);
        PRACTIKA.State.purchaseMode = "subscription";
        PRACTIKA.toast(`📦 Plan ${plan.name} agregado · modo suscripción`);
        PRACTIKA.App.navigate("checkout");
      });
    });
  }
};
