/* ============================================================
   PRACTIKA · core/state.js
   Estado de la sesión en memoria (rol actual, categoría
   seleccionada, modo de compra). No se persiste.
   ============================================================ */
window.PRACTIKA = window.PRACTIKA || {};

PRACTIKA.State = {
  role: "cliente",          // cliente | operador | admin
  view: "catalog",          // vista activa
  activeCategory: null,     // slug de categoría filtrada (null = todas)
  purchaseMode: "subscription", // subscription | single

  // Usuario demo "logueado" como cliente
  currentUser: { id: 99, name: "Invitado" }
};
