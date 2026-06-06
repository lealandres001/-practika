/* ============================================================
   PRACTIKA · ui/checkout.view.js
   Carrito + flujo de compra: modo (suscripción/único),
   agendamiento de entrega y pasarela de pagos simulada.
   ============================================================ */
window.PRACTIKA = window.PRACTIKA || {};

PRACTIKA.CheckoutView = {
  // selección temporal de entrega
  _day: null,
  _slot: null,

  render() {
    const lines = PRACTIKA.CartService.detailed();
    if (lines.length === 0) {
      document.getElementById("view").innerHTML = `
        <div class="empty">
          <div class="big">🛒</div>
          <h2>Tu carrito está vacío</h2>
          <p>Agrega productos o suscríbete a un plan para empezar.</p>
          <br/>
          <button class="btn btn-primary" data-nav="catalog">Ver catálogo</button>
        </div>`;
      document.querySelector("[data-nav='catalog']")
        .addEventListener("click", () => PRACTIKA.App.navigate("catalog"));
      return;
    }

    const S = PRACTIKA.State;
    const subtotal = PRACTIKA.CartService.subtotal();
    const total = PRACTIKA.OrderService.computeTotal(subtotal, S.purchaseMode);
    const discount = subtotal - total;

    const itemsHtml = lines.map(li => `
      <div class="line-item">
        <span class="li-emoji">${li.product.emoji}</span>
        <div class="li-info">
          <strong>${PRACTIKA.UI.esc(li.product.name)}</strong>
          <small>${PRACTIKA.UI.esc(li.product.unit)} · ${PRACTIKA.fmt.cop(li.product.price_cop)}</small>
        </div>
        <div class="qty">
          <button data-dec="${li.product_id}" aria-label="Quitar uno">−</button>
          <span>${li.qty}</span>
          <button data-inc="${li.product_id}" aria-label="Agregar uno">+</button>
        </div>
        <strong>${PRACTIKA.fmt.cop(li.product.price_cop * li.qty)}</strong>
        <button class="btn btn-danger btn-sm" data-rm="${li.product_id}" aria-label="Eliminar">✕</button>
      </div>`).join("");

    const dayOpts = PRACTIKA.SEED.deliveryDays.map(d =>
      `<div class="day-opt ${this._day === d ? "active" : ""}" data-day="${d}">${d}</div>`).join("");
    const slotOpts = PRACTIKA.SEED.deliverySlots.map(s =>
      `<option value="${s}" ${this._slot === s ? "selected" : ""}>${s}</option>`).join("");
    const zoneOpts = PRACTIKA.RoutingService.zones().map(z =>
      `<option value="${z.id}">${PRACTIKA.UI.esc(z.name)}</option>`).join("");

    document.getElementById("view").innerHTML = `
      <div class="section-head"><h2>Finaliza tu pedido</h2><p>Suscríbete en 3 clics</p></div>
      <div class="steps">
        <div class="step done">1 · Productos</div>
        <div class="step active">2 · Modo y entrega</div>
        <div class="step">3 · Pago</div>
      </div>

      <div class="two-col">
        <div>
          <div class="panel">
            <h3>🛒 Tu carrito</h3>
            ${itemsHtml}
          </div>

          <div class="panel" style="margin-top:18px;">
            <h3>🚚 Agenda tu entrega</h3>
            <div class="field">
              <label for="zone">Zona de entrega</label>
              <select id="zone">
                <option value="">Selecciona tu zona…</option>
                ${zoneOpts}
              </select>
            </div>
            <div class="field">
              <label>Día de entrega</label>
              <div class="delivery-days">${dayOpts}</div>
            </div>
            <div class="field">
              <label for="slot">Ventana horaria</label>
              <select id="slot">
                <option value="">Selecciona una franja…</option>
                ${slotOpts}
              </select>
            </div>
          </div>

          <div class="panel" style="margin-top:18px;">
            <h3>👤 Datos del cliente</h3>
            <div class="field">
              <label for="c-name">Nombre completo</label>
              <input id="c-name" type="text" placeholder="Ej: María Gómez" value="${PRACTIKA.UI.esc(S.currentUser.name === "Invitado" ? "" : S.currentUser.name)}" />
            </div>
            <div class="field">
              <label for="c-email">Correo</label>
              <input id="c-email" type="email" placeholder="correo@ejemplo.com" />
            </div>
            <div class="field">
              <label for="c-address">Dirección de entrega</label>
              <input id="c-address" type="text" placeholder="Calle 00 # 00-00, ciudad" />
            </div>
          </div>
        </div>

        <div>
          <div class="panel">
            <h3>Modo de compra</h3>
            <div class="mode-toggle">
              <div class="mode-opt ${S.purchaseMode === "subscription" ? "active" : ""}" data-mode="subscription">
                <strong>🔁 Suscripción</strong>
                <small>Cobro mensual automático</small>
                <div><span class="badge-save">Ahorra 10%</span></div>
              </div>
              <div class="mode-opt ${S.purchaseMode === "single" ? "active" : ""}" data-mode="single">
                <strong>🛍️ Pedido único</strong>
                <small>Pago por esta vez</small>
              </div>
            </div>

            <div class="summary-row"><span>Subtotal</span><span>${PRACTIKA.fmt.cop(subtotal)}</span></div>
            ${discount > 0 ? `<div class="summary-row" style="color:var(--green-600)"><span>Descuento suscripción</span><span>− ${PRACTIKA.fmt.cop(discount)}</span></div>` : ""}
            <div class="summary-row"><span>Envío</span><span>Gratis</span></div>
            <div class="summary-row total"><span>Total ${S.purchaseMode === "subscription" ? "/mes" : ""}</span><span>${PRACTIKA.fmt.cop(total)}</span></div>

            <br/>
            <button class="btn btn-primary btn-block" id="pay-btn">
              💳 Pagar ${PRACTIKA.fmt.cop(total)}
            </button>
            <p class="muted" style="font-size:12px;text-align:center;margin-top:8px;">
              Pago seguro vía ePayco / Bold / MercadoPago (simulado)
            </p>
          </div>
        </div>
      </div>
    `;

    this.bind();
  },

  bind() {
    const view = document.getElementById("view");

    view.querySelectorAll("[data-inc]").forEach(b => b.addEventListener("click", () => {
      const id = Number(b.dataset.inc);
      const li = PRACTIKA.CartService.items().find(x => x.product_id === id);
      PRACTIKA.CartService.setQty(id, li.qty + 1);
      this.render(); PRACTIKA.App.refreshCartCount();
    }));
    view.querySelectorAll("[data-dec]").forEach(b => b.addEventListener("click", () => {
      const id = Number(b.dataset.dec);
      const li = PRACTIKA.CartService.items().find(x => x.product_id === id);
      PRACTIKA.CartService.setQty(id, li.qty - 1);
      this.render(); PRACTIKA.App.refreshCartCount();
    }));
    view.querySelectorAll("[data-rm]").forEach(b => b.addEventListener("click", () => {
      PRACTIKA.CartService.remove(Number(b.dataset.rm));
      this.render(); PRACTIKA.App.refreshCartCount();
    }));

    view.querySelectorAll("[data-mode]").forEach(opt => opt.addEventListener("click", () => {
      PRACTIKA.State.purchaseMode = opt.dataset.mode;
      this.render();
    }));

    view.querySelectorAll("[data-day]").forEach(d => d.addEventListener("click", () => {
      this._day = d.dataset.day;
      this.render();
    }));

    const slot = view.querySelector("#slot");
    if (slot) slot.addEventListener("change", () => { this._slot = slot.value; });

    const payBtn = view.querySelector("#pay-btn");
    if (payBtn) payBtn.addEventListener("click", () => this.pay());
  },

  pay() {
    const view = document.getElementById("view");
    const name = view.querySelector("#c-name").value.trim();
    const email = view.querySelector("#c-email").value.trim();
    const address = view.querySelector("#c-address").value.trim();
    const slot = view.querySelector("#slot").value;
    const zoneId = Number(view.querySelector("#zone").value) || null;

    if (!zoneId) { PRACTIKA.toast("⚠️ Selecciona tu zona de entrega"); return; }
    if (!this._day || !slot) { PRACTIKA.toast("⚠️ Selecciona día y franja de entrega"); return; }
    if (!name || !email || !address) { PRACTIKA.toast("⚠️ Completa tus datos de cliente"); return; }

    // Pasarela simulada
    const payBtn = view.querySelector("#pay-btn");
    payBtn.disabled = true;
    payBtn.textContent = "Procesando pago…";

    const items = PRACTIKA.CartService.items().map(li => ({ product_id: li.product_id, qty: li.qty }));

    setTimeout(async () => {
      try {
        const order = await PRACTIKA.Gateway.createOrder({
          mode: PRACTIKA.State.purchaseMode,
          items,
          delivery_day: this._day,
          delivery_slot: slot,
          zone_id: zoneId,
          customer: { id: PRACTIKA.State.currentUser.id, name, email, address }
        });
        this._day = null; this._slot = null;
        PRACTIKA.App.refreshCartCount();
        PRACTIKA.CheckoutView.renderSuccess(order);
      } catch (e) {
        PRACTIKA.toast("❌ " + e.message);
        payBtn.disabled = false;
        payBtn.textContent = "💳 Reintentar pago";
      }
    }, 700);
  },

  renderSuccess(order) {
    const isSub = order.type === "subscription";
    const op = order.operator || (order.operator_id ? PRACTIKA.RoutingService.operatorById(order.operator_id) : null);
    const zone = order.zone || (order.zone_id ? PRACTIKA.RoutingService.zoneById(order.zone_id) : null);
    const opLine = op
      ? `<div class="summary-row"><span>Operador asignado</span><span>👨‍🍳 ${PRACTIKA.UI.esc(op.name)} · ⭐ ${op.rating} · ${order.assignment_distance} km</span></div>`
      : `<div class="summary-row"><span>Operador</span><span class="muted">En asignación…</span></div>`;
    document.getElementById("view").innerHTML = `
      <div class="empty">
        <div class="big">🎉</div>
        <h2>¡Pago aprobado!</h2>
        <p>Tu pedido <strong>${order.id}</strong> fue confirmado.</p>
        <div class="panel" style="max-width:480px;margin:20px auto;text-align:left;">
          <div class="summary-row"><span>Modo</span><span>${isSub ? "🔁 Suscripción mensual" : "🛍️ Pedido único"}</span></div>
          <div class="summary-row"><span>Zona</span><span>📍 ${zone ? PRACTIKA.UI.esc(zone.name) : "—"}</span></div>
          ${opLine}
          <div class="summary-row"><span>Entrega</span><span>${order.delivery_day} · ${order.delivery_slot}</span></div>
          <div class="summary-row"><span>Dirección</span><span>${PRACTIKA.UI.esc(order.customer_address)}</span></div>
          <div class="summary-row total"><span>Total ${isSub ? "/mes" : ""}</span><span>${PRACTIKA.fmt.cop(order.total)}</span></div>
          ${isSub ? `<p class="muted" style="font-size:12px;margin-top:10px;">Se cobrará automáticamente cada mes. Puedes cancelar cuando quieras.</p>` : ""}
        </div>
        <button class="btn btn-primary" id="back-catalog">Seguir comprando</button>
      </div>`;
    document.getElementById("back-catalog")
      .addEventListener("click", () => PRACTIKA.App.navigate("catalog"));
  }
};
