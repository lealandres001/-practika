/* ============================================================
   PRACTIKA · ui/academy.view.js  [FASE 3]
   Ecosistema educativo: videocursos, PDFs descargables y retos
   de organización de despensa.
   ============================================================ */
window.PRACTIKA = window.PRACTIKA || {};

PRACTIKA.AcademyView = {
  render() {
    const courses = PRACTIKA.Store.table("courses");

    const cards = courses.map(c => {
      const lessons = c.lessons.map(l => `<li>▶️ ${PRACTIKA.UI.esc(l)}</li>`).join("");
      return `
        <div class="panel course-card">
          <div class="course-head">
            <span class="course-emoji">${c.emoji}</span>
            <div>
              <h3>${PRACTIKA.UI.esc(c.title)}</h3>
              <p class="muted" style="font-size:13px;">${PRACTIKA.UI.esc(c.description)}</p>
            </div>
          </div>
          <ul class="lesson-list">${lessons}</ul>
          <div class="course-foot">
            <button class="btn btn-ghost btn-sm" data-pdf="${PRACTIKA.UI.esc(c.pdf)}">📄 Descargar PDF</button>
            <button class="btn btn-amber btn-sm" data-challenge="${c.id}">🏆 Ver reto</button>
          </div>
          <p class="challenge-text muted" id="ch-${c.id}" hidden>${PRACTIKA.UI.esc(c.challenge)}</p>
        </div>`;
    }).join("");

    document.getElementById("view").innerHTML = `
      <section class="hero academy-hero">
        <h1>🎓 Academia PRACTIKA</h1>
        <p>Aprende el método del Chef Álvaro: organiza tu despensa, domina el empaque al vacío y cocina toda la semana sin estrés.</p>
        <div class="pills">
          <span class="pill">🎥 Videocursos</span>
          <span class="pill">📄 PDFs descargables</span>
          <span class="pill">🏆 Retos semanales</span>
        </div>
      </section>
      <div class="grid courses-grid">${cards}</div>
    `;

    this.bind();
  },

  bind() {
    const view = document.getElementById("view");

    view.querySelectorAll("[data-pdf]").forEach(btn =>
      btn.addEventListener("click", () =>
        PRACTIKA.toast(`📄 Descargando “${btn.dataset.pdf}” (demo)`)));

    view.querySelectorAll("[data-challenge]").forEach(btn =>
      btn.addEventListener("click", () => {
        const el = view.querySelector("#ch-" + btn.dataset.challenge);
        if (el) el.hidden = !el.hidden;
      }));
  }
};
