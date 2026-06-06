/* ============================================================
   PRACTIKA · ui/admin.view.js
   Panel central: KPIs, demanda por categoría, red de operadores
   (Fase 2) y predicción de demanda con IA (Fase 3).
   ============================================================ */
window.PRACTIKA = window.PRACTIKA || {};

PRACTIKA.AdminView = {
  async render() {
    document.getElementById("view").innerHTML = `
      <div class="section-head"><h2>🛠️ Panel de Administración</h2><p>Cargando…</p></div>`;

    const [metricsData, predictionData, operators, orders] = await Promise.all([
      PRACTIKA.Gateway.metrics(),
      PRACTIKA.Gateway.prediction(),
      PRACTIKA.Gateway.operators(),
      PRACTIKA.Gateway.orders()
    ]);
    const m = metricsData.summary;
    const demand = metricsData.demandByCategory;
    const forecast = predictionData.forecast;
    const provisioning = predictionData.provisioning;

    document.getElementById("view").innerHTML = `
      <div class="section-head"><h2>🛠️ Panel de Administración</h2><p>Monitoreo integral · Fases 1-3</p></div>
      <div class="metric-grid">${this.metricsHtml(m)}</div>

      <div class="two-col">
        <div class="panel">
          <h3>📋 Pedidos recientes</h3>
          <div style="overflow-x:auto;">${this.ordersTable(orders)}</div>
        </div>
        <div class="panel">
          <h3>📊 Demanda por categoría</h3>
          <p class="muted" style="font-size:12px;margin-bottom:14px;">Volumen histórico de pedidos</p>
          ${this.demandBars(demand)}
        </div>
      </div>

      <div class="section-head"><h2>🤖 Predicción de demanda (IA)</h2><p>Fase 3 · pronóstico próxima semana</p></div>
      <div class="two-col">
        <div class="panel">
          <h3>📈 Pronóstico por categoría</h3>
          <p class="muted" style="font-size:12px;margin-bottom:14px;">Media móvil + tendencia. Anticipa insumos y reduce mermas.</p>
          ${this.forecastTable(forecast)}
        </div>
        <div class="panel">
          <h3>📦 Aprovisionamiento sugerido por operador</h3>
          <p class="muted" style="font-size:12px;margin-bottom:14px;">Reparto del pronóstico según capacidad.</p>
          ${this.provisioningTable(provisioning)}
        </div>
      </div>

      <div class="section-head"><h2>🗺️ Red de operadores</h2><p>Fase 2 · marketplace colaborativo</p></div>
      <div class="panel">
        ${this.operatorsTable(operators)}
        <br/>
        <button class="btn btn-outline btn-block btn-sm" id="reset-db">♻️ Reiniciar datos demo</button>
      </div>
    `;

    const reset = document.getElementById("reset-db");
    if (reset) reset.addEventListener("click", async () => {
      await PRACTIKA.Gateway.reset();
      PRACTIKA.App.refreshCartCount();
      PRACTIKA.toast("♻️ Datos demo reiniciados");
      this.render();
    });
  },

  metricsHtml(m) {
    return `
      <div class="metric"><div class="label"><span class="ico">📦</span>Pedidos totales</div><div class="value">${m.totalOrders}</div></div>
      <div class="metric"><div class="label"><span class="ico">💰</span>Ingresos</div><div class="value">${PRACTIKA.fmt.cop(m.revenue)}</div></div>
      <div class="metric"><div class="label"><span class="ico">🔁</span>MRR (recurrente)</div><div class="value">${PRACTIKA.fmt.cop(m.mrr)}</div></div>
      <div class="metric"><div class="label"><span class="ico">📈</span>Tasa suscripción</div><div class="value">${m.subscriptionRate}%</div></div>
      <div class="metric"><div class="label"><span class="ico">🎟️</span>Ticket promedio</div><div class="value">${PRACTIKA.fmt.cop(m.avgTicket)}</div></div>`;
  },

  ordersTable(orders) {
    const rows = orders.map(o => {
      const op = o.operator || (o.operator_id ? PRACTIKA.RoutingService.operatorById(o.operator_id) : null);
      return `
      <tr>
        <td><strong>${o.id}</strong></td>
        <td>${PRACTIKA.UI.esc(o.user_name)}</td>
        <td>${o.type === "subscription" ? "🔁 Susc." : "🛍️ Único"}</td>
        <td>${op ? PRACTIKA.UI.esc(op.name) : "<span class='muted'>—</span>"}</td>
        <td><span class="status ${o.status}">${o.status}</span></td>
        <td>${PRACTIKA.fmt.cop(o.total)}</td>
      </tr>`;
    }).join("");
    return `<table class="data">
      <thead><tr><th>Pedido</th><th>Cliente</th><th>Tipo</th><th>Operador</th><th>Estado</th><th>Total</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="6" class="muted">Sin pedidos aún</td></tr>`}</tbody>
    </table>`;
  },

  demandBars(demand) {
    const max = Math.max(1, ...Object.values(demand));
    return Object.entries(demand).map(([cat, qty]) => `
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;">
          <span>${PRACTIKA.UI.esc(cat)}</span><strong>${qty} und</strong>
        </div>
        <div style="background:var(--green-050);border-radius:999px;height:10px;overflow:hidden;">
          <div style="width:${(qty / max) * 100}%;height:100%;background:var(--green-600);"></div>
        </div>
      </div>`).join("");
  },

  forecastTable(forecast) {
    const rows = forecast.map(f => {
      const arrow = f.growthPct >= 0 ? "▲" : "▼";
      const color = f.growthPct >= 0 ? "var(--green-600)" : "var(--danger)";
      return `<tr>
        <td>${PRACTIKA.UI.esc(f.category)}</td>
        <td>${f.lastWeek} und</td>
        <td><strong>${f.forecast} und</strong></td>
        <td style="color:${color};font-weight:700;">${arrow} ${Math.abs(f.growthPct)}%</td>
      </tr>`;
    }).join("");
    return `<table class="data">
      <thead><tr><th>Categoría</th><th>Sem. actual</th><th>Pronóstico</th><th>Tendencia</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  },

  provisioningTable(prov) {
    const rows = prov.map(p => `
      <tr>
        <td>👨‍🍳 ${PRACTIKA.UI.esc(p.operator.name)}</td>
        <td>Cap. ${p.operator.capacity}</td>
        <td><strong>${p.units} und</strong></td>
      </tr>`).join("");
    return `<table class="data">
      <thead><tr><th>Operador</th><th>Capacidad</th><th>Insumos sugeridos</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="3" class="muted">Sin operadores certificados</td></tr>`}</tbody>
    </table>`;
  },

  operatorsTable(operators) {
    const rows = operators.map(o => {
      const zone = PRACTIKA.RoutingService.zoneById(o.zone_id);
      const cert = o.certified
        ? `<span class="status listo">certificado</span>`
        : `<span class="status pendiente">en formación</span>`;
      const loadPct = Math.round((o.load / o.capacity) * 100);
      return `<tr>
        <td>👨‍🍳 ${PRACTIKA.UI.esc(o.name)}</td>
        <td>📍 ${zone ? PRACTIKA.UI.esc(zone.name) : "—"}</td>
        <td>${cert}</td>
        <td>${o.load}/${o.capacity} (${loadPct}%)</td>
        <td>${o.rating ? "⭐ " + o.rating : "<span class='muted'>—</span>"}</td>
      </tr>`;
    }).join("");
    return `<div style="overflow-x:auto;"><table class="data">
      <thead><tr><th>Operador</th><th>Zona</th><th>Estado</th><th>Carga</th><th>Rating</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  }
};
