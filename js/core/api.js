/* ============================================================
   PRACTIKA · core/api.js
   Cliente REST opcional para hablar con el backend (server/).
   Si defines window.PRACTIKA_API_BASE, las vistas pueden usar
   estos métodos para datos centralizados (multiusuario).
   Por defecto la demo sigue funcionando con localStorage.
   ============================================================ */
window.PRACTIKA = window.PRACTIKA || {};

PRACTIKA.Api = (function () {
  const base = (window.PRACTIKA_API_BASE || "/api").replace(/\/$/, "");

  async function request(path, options = {}) {
    const res = await fetch(base + path, {
      headers: { "Content-Type": "application/json" },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return res.status === 204 ? null : res.json();
  }

  return {
    base,
    health:      () => request("/health"),
    categories:  () => request("/categories"),
    products:    (cat) => request("/products" + (cat ? `?category=${encodeURIComponent(cat)}` : "")),
    plans:       () => request("/plans"),
    courses:     () => request("/courses"),
    zones:       () => request("/zones"),
    operators:   () => request("/operators"),
    orders:      () => request("/orders"),
    createOrder: (payload) => request("/orders", { method: "POST", body: payload }),
    advanceOrder:(id) => request(`/orders/${id}/advance`, { method: "POST" }),
    saveTrace:   (id, data) => request(`/orders/${id}/traceability`, { method: "PATCH", body: data }),
    metrics:     () => request("/admin/metrics"),
    prediction:  () => request("/admin/prediction"),
    reset:       () => request("/admin/reset", { method: "POST" })
  };
})();
