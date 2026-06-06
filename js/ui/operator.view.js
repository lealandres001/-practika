/* ============================================================
   PRACTIKA · ui/operator.view.js
   Vista del Operador "Practiker": cola de pedidos asignados,
   flujo de preparación guiada (checklist) y avance de estado.
   Usa el Gateway (servidor si está disponible, local si no).
   ============================================================ */
window.PRACTIKA = window.PRACTIKA || {};

PRACTIKA.OperatorView = {
  _orders: [],

  // Pasos estándar de preparación (receta + empaque al vacío)
  steps(order) {
    const items = PRACTIKA.OrderService.detailedItems(order);
    const prep = items.map(it => `Preparar ${it.qty} × ${it.product.name} según receta estándar`);
    return [
      "Verificar materia prima e inventario",
      ...prep,
      "Pesar y porcionar según gramaje exacto",
      "Sellar al vacío y etiquetar lote",
      "Confirmar empaque listo para despacho"
    ];
  },

  orderById(id) {
    return this._orders.find(o => o.id === id) || null;
  },

  async render() {
    document.getElementById("view").innerHTML = `
      <div class="section-head"><h2>👨‍🍳 Panel del Operador</h2><p>Cargando…</p></div>`;

    const all = await PRACTIKA.Gateway.orders();
    this._orders = all;
    const orders = all.filter(o => o.status !== "entregado");

    const queue = orders.length
      ? orders.map(o => this.orderCard(o)).join("")
      : `<div class="empty"><div class="big">✅</div><p>No hay pedidos pendientes. ¡Buen trabajo!</p></div>`;

    document.getElementById("view").innerHTML = `
      <div class="section-head">
        <h2>👨‍🍳 Panel del Operador</h2>
        <p>${orders.length} pedido(s) en cola</p>
      </div>
      <p class="muted" style="margin-bottom:18px;">Sigue el checklist obligatorio para garantizar la receta exacta del Chef Álvaro y la trazabilidad del lote.</p>
      ${queue}
    `;
    this.bind();
  },

  orderCard(o) {
    const items = PRACTIKA.OrderService.detailedItems(o);
    const itemsTxt = items.map(it => `${it.qty}× ${it.product.emoji} ${PRACTIKA.UI.esc(it.product.name)}`).join(" · ");
    const checklists = PRACTIKA.Store.get("checklists") || {};
    const steps = this.steps(o);
    const checked = checklists[o.id] || steps.map(() => false);
    const allDone = checked.every(Boolean);
    const op = o.operator || (o.operator_id ? PRACTIKA.RoutingService.operatorById(o.operator_id) : null);
    const zone = o.zone || (o.zone_id ? PRACTIKA.RoutingService.zoneById(o.zone_id) : null);
    const tr = o.traceability || { lot: "", weight: "", vacuum_ok: false };

    const list = steps.map((s, i) => `
      <li class="${checked[i] ? "checked" : ""}" data-order="${o.id}" data-step="${i}">
        <input type="checkbox" ${checked[i] ? "checked" : ""} />
        <span>${PRACTIKA.UI.esc(s)}</span>
      </li>`).join("");

    const nextLabel = {
      pendiente: "▶️ Iniciar preparación",
      preparacion: "✅ Marcar como listo",
      listo: "🚚 Marcar entregado"
    }[o.status];

    // [FASE 2] Captura de trazabilidad de lote
    const traceBlock = `
      <div class="trace-box">
        <strong style="font-size:13px;">🔖 Trazabilidad del lote</strong>
        <div class="trace-grid">
          <input type="text" placeholder="N° de lote" value="${PRACTIKA.UI.esc(tr.lot)}" data-trace="lot" data-oid="${o.id}" />
          <input type="text" placeholder="Peso real (g)" value="${PRACTIKA.UI.esc(tr.weight)}" data-trace="weight" data-oid="${o.id}" />
          <label class="vacuum-check">
            <input type="checkbox" ${tr.vacuum_ok ? "checked" : ""} data-trace="vacuum_ok" data-oid="${o.id}" />
            Sellado al vacío correcto
          </label>
        </div>
      </div>`;

    return `
      <div class="order-card">
        <div class="order-head">
          <div>
            <strong>${o.id}</strong> · ${PRACTIKA.UI.esc(o.user_name)}
            <div class="muted" style="font-size:13px;">${itemsTxt}</div>
          </div>
          <span class="status ${o.status}">${o.status}</span>
        </div>
        <div class="muted" style="font-size:13px;">
          📍 ${zone ? PRACTIKA.UI.esc(zone.name) : "—"}
          ${op ? `· 👨‍🍳 ${PRACTIKA.UI.esc(op.name)} (${o.assignment_distance != null ? o.assignment_distance + " km" : "asignado"})` : ""}
          &nbsp;|&nbsp; 🚚 ${o.delivery_day} · ${o.delivery_slot}
          &nbsp;|&nbsp; ${o.type === "subscription" ? "🔁 Suscripción" : "🛍️ Único"}
        </div>
        <ul class="checklist">${list}</ul>
        ${traceBlock}
        <button class="btn btn-primary btn-sm" data-advance="${o.id}" ${o.status !== "pendiente" && !allDone ? "disabled" : ""}>
          ${nextLabel || ""}
        </button>
        ${o.status !== "pendiente" && !allDone ? `<span class="muted" style="font-size:12px;margin-left:8px;">Completa el checklist para avanzar</span>` : ""}
      </div>`;
  },

  bind() {
    const view = document.getElementById("view");

    view.querySelectorAll(".checklist li").forEach(li => {
      li.addEventListener("click", () => {
        const id = li.dataset.order;
        const step = Number(li.dataset.step);
        const checklists = PRACTIKA.Store.get("checklists") || {};
        const steps = this.steps(this.orderById(id));
        if (!checklists[id]) checklists[id] = steps.map(() => false);
        checklists[id][step] = !checklists[id][step];
        PRACTIKA.Store.set("checklists", checklists);
        this.render();
      });
    });

    view.querySelectorAll("[data-advance]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.advance;
        try {
          const order = await PRACTIKA.Gateway.advanceOrder(id);
          PRACTIKA.toast(`Pedido ${id} → ${order.status}`);
        } catch (e) { PRACTIKA.toast("❌ " + e.message); }
        this.render();
      });
    });

    // [FASE 2] Guardado de trazabilidad (lote, peso, sellado)
    view.querySelectorAll("[data-trace]").forEach(input => {
      const handler = async () => {
        const id = input.dataset.oid;
        const field = input.dataset.trace;
        const value = input.type === "checkbox" ? input.checked : input.value;
        try {
          await PRACTIKA.Gateway.saveTrace(id, { [field]: value });
          if (input.type === "checkbox") PRACTIKA.toast("🔖 Trazabilidad actualizada");
        } catch (e) { PRACTIKA.toast("❌ " + e.message); }
      };
      input.addEventListener(input.type === "checkbox" ? "change" : "blur", handler);
    });
  }
};
