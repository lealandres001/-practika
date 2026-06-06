/* ============================================================
   PRACTIKA · app.js
   Orquestador: navegación, navbar según rol e inicialización.
   ============================================================ */
window.PRACTIKA = window.PRACTIKA || {};

PRACTIKA.App = {
  // Navegación disponible por rol
  NAV: {
    cliente:  [{ id: "catalog",  label: "🍽️ Catálogo" }, { id: "academy", label: "🎓 Academia" }, { id: "checkout", label: "🛒 Carrito" }],
    operador: [{ id: "operator", label: "👨‍🍳 Mis pedidos" }],
    admin:    [{ id: "admin",    label: "🛠️ Dashboard" }]
  },

  VIEWS: {
    catalog:  () => PRACTIKA.CatalogView.render(),
    checkout: () => PRACTIKA.CheckoutView.render(),
    academy:  () => PRACTIKA.AcademyView.render(),
    operator: () => PRACTIKA.OperatorView.render(),
    admin:    () => PRACTIKA.AdminView.render()
  },

  async init() {
    // Cambio de rol
    const switcher = document.getElementById("role-switcher");
    switcher.value = PRACTIKA.State.role;
    switcher.addEventListener("change", () => this.setRole(switcher.value));

    // Click en el logo -> vista por defecto del rol
    document.querySelector(".brand").addEventListener("click", () => {
      this.navigate(this.defaultView());
    });

    // Botón carrito del header
    document.querySelector(".btn-cart").addEventListener("click", () => this.navigate("checkout"));

    // Detecta backend y actualiza el indicador de conexión
    await PRACTIKA.Gateway.init();
    this.updateConnBadge();

    this.renderNav();
    this.refreshCartCount();
    this.setupInstall();
    this.navigate(this.defaultView());
  },

  updateConnBadge() {
    const badge = document.getElementById("conn-badge");
    if (!badge) return;
    if (PRACTIKA.Gateway.isOnline()) {
      badge.textContent = "● En línea";
      badge.title = "Conectado al servidor (datos compartidos)";
      badge.className = "conn-badge online";
    } else {
      badge.textContent = "● Local";
      badge.title = "Modo demo: datos en este navegador";
      badge.className = "conn-badge offline";
    }
  },

  // Prompt de instalación PWA (aparece cuando el navegador lo soporta)
  setupInstall() {
    const btn = document.getElementById("install-btn");
    if (!btn) return;
    let deferred = null;

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferred = e;
      btn.hidden = false;
    });

    btn.addEventListener("click", async () => {
      if (!deferred) return;
      deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      btn.hidden = true;
    });

    window.addEventListener("appinstalled", () => {
      btn.hidden = true;
      PRACTIKA.toast("✅ App instalada");
    });
  },

  defaultView() {
    return this.NAV[PRACTIKA.State.role][0].id;
  },

  setRole(role) {
    PRACTIKA.State.role = role;
    this.renderNav();
    this.navigate(this.defaultView());
  },

  renderNav() {
    const nav = document.getElementById("role-nav");
    const items = this.NAV[PRACTIKA.State.role];
    nav.innerHTML = items.map(i =>
      `<button data-view="${i.id}" class="${PRACTIKA.State.view === i.id ? "active" : ""}">${i.label}</button>`
    ).join("");
    nav.querySelectorAll("[data-view]").forEach(btn =>
      btn.addEventListener("click", () => this.navigate(btn.dataset.view)));

    // El carrito solo tiene sentido para el cliente
    document.querySelector(".btn-cart").style.display =
      PRACTIKA.State.role === "cliente" ? "" : "none";
  },

  navigate(view) {
    if (!this.VIEWS[view]) view = this.defaultView();
    PRACTIKA.State.view = view;
    this.renderNav();
    window.scrollTo({ top: 0, behavior: "smooth" });
    this.VIEWS[view]();
  },

  refreshCartCount() {
    document.getElementById("cart-count").textContent = PRACTIKA.CartService.count();
  }
};

document.addEventListener("DOMContentLoaded", () => PRACTIKA.App.init());
