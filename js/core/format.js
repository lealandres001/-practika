/* ============================================================
   PRACTIKA · core/format.js
   Utilidades de formato y notificaciones de UI.
   ============================================================ */
window.PRACTIKA = window.PRACTIKA || {};

PRACTIKA.fmt = {
  /** Formatea pesos colombianos: 28900 -> "$ 28.900" */
  cop(value) {
    return "$ " + Math.round(value).toLocaleString("es-CO");
  },

  /** Fecha legible corta. */
  date(iso) {
    try {
      return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
    } catch (e) { return iso; }
  }
};

/** Notificación tipo toast. */
PRACTIKA.toast = (function () {
  let timer = null;
  return function (message) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove("show"), 2400);
  };
})();
