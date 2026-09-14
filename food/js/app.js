const summaryEl = document.getElementById("summary");
const statusEl = document.getElementById("status");
const alertBanner = document.getElementById("alert-banner");
const alertText = document.getElementById("alert-text");
const searchInput = document.getElementById("search-input");
const categoryPillsEl = document.getElementById("category-pills");
const locationPillsEl = document.getElementById("location-pills");
const contentEl = document.getElementById("content");
const bellBtn = document.getElementById("bell-btn");
const bellDot = document.getElementById("bell-dot");

const fab = document.getElementById("fab");
const addModal = document.getElementById("add-modal");
const addForm = document.getElementById("add-form");
const categorySelect = document.getElementById("category-select");
const emplacementSegmented = document.getElementById("emplacement-segmented");
const emplacementValue = document.getElementById("emplacement-value");
const imageInput = document.getElementById("image-input");
const imagePreview = document.getElementById("image-preview");
const fileName = document.getElementById("file-name");

const consumedModal = document.getElementById("consumed-modal");
const consumedItemName = document.getElementById("consumed-item-name");
const partialModal = document.getElementById("partial-modal");
const partialItemName = document.getElementById("partial-item-name");
const partialStockLabel = document.getElementById("partial-stock-label");
const partialInput = document.getElementById("partial-input");

const navBtns = document.querySelectorAll(".nav-btn");
const courseForm = document.getElementById("course-form");
const courseInput = document.getElementById("course-input");
const coursesListEl = document.getElementById("courses-list");
const coursesSummaryEl = document.getElementById("courses-summary");
const clearAchetesBtn = document.getElementById("clear-achetes-btn");
const historiqueListEl = document.getElementById("historique-list");

const NOTIFIED_KEY = "food-notified-ids";

let filterCategory = "Toutes";
let filterEmplacement = "Partout";
let searchText = "";
let pendingImage = null;
let activeItemId = null;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.className = isError ? "status error" : "status";
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function formatDate(dateStr) {
  const iso = dateStr.includes(" ") ? dateStr.replace(" ", "T") : dateStr;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function statusLabel(days) {
  if (days < 0) return "Périmé";
  if (days === 0) return "Périme aujourd'hui";
  if (days <= 3) return `Dans ${days} jour${days > 1 ? "s" : ""}`;
  return null;
}

// ==== Filtres ====

function buildPills() {
  categoryPillsEl.innerHTML = ["Toutes", ...CATEGORIES]
    .map((cat) => `<button class="pill${cat === filterCategory ? " active" : ""}" data-cat="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`)
    .join("");

  locationPillsEl.innerHTML = ["Partout", ...EMPLACEMENTS]
    .map((loc) => `<button class="pill${loc === filterEmplacement ? " active" : ""}" data-loc="${escapeHtml(loc)}">${escapeHtml(loc)}</button>`)
    .join("");

  categoryPillsEl.querySelectorAll(".pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      filterCategory = btn.dataset.cat;
      refresh();
    });
  });

  locationPillsEl.querySelectorAll(".pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      filterEmplacement = btn.dataset.loc;
      refresh();
    });
  });
}

function getFilteredRows() {
  const rows = getActiveAliments();
  const search = searchText.trim().toLowerCase();
  return rows.filter((r) => {
    if (filterCategory !== "Toutes" && r.type !== filterCategory) return false;
    if (filterEmplacement !== "Partout" && r.emplacement !== filterEmplacement) return false;
    if (search && !r.nom.toLowerCase().includes(search)) return false;
    return true;
  });
}

// ==== Rendu ====

function refresh() {
  buildPills();
  const allRows = getActiveAliments();
  const rows = getFilteredRows();

  renderSummary(allRows);
  renderContent(rows);
  checkReminders(allRows);
}

function renderSummary(allRows) {
  const urgent = allRows.filter((r) => {
    const d = daysUntil(r.peremption);
    return d <= 3;
  });

  summaryEl.textContent = `${allRows.length} aliment${allRows.length > 1 ? "s" : ""} · ${urgent.length} à surveiller`;

  if (urgent.length > 0) {
    alertBanner.hidden = false;
    alertText.textContent = `${urgent.length} aliment${urgent.length > 1 ? "s" : ""} à consommer vite`;
    bellDot.hidden = false;
  } else {
    alertBanner.hidden = true;
    bellDot.hidden = true;
  }
}

function renderContent(rows) {
  if (rows.length === 0) {
    contentEl.innerHTML = `<p class="empty">Aucun aliment enregistré</p>`;
    return;
  }

  const groups = new Map();
  rows.forEach((item) => {
    if (!groups.has(item.type)) groups.set(item.type, []);
    groups.get(item.type).push(item);
  });

  const sections = [...groups.entries()].sort((a, b) => {
    const minA = Math.min(...a[1].map((i) => daysUntil(i.peremption)));
    const minB = Math.min(...b[1].map((i) => daysUntil(i.peremption)));
    return minA - minB;
  });

  contentEl.innerHTML = sections
    .map(([type, items]) => `
      <div class="category-section">
        <h2>${escapeHtml(type)} <span class="count">${items.length} article${items.length > 1 ? "s" : ""}</span></h2>
        <div class="items-grid">
          ${items.map(renderCard).join("")}
        </div>
      </div>
    `)
    .join("");

  contentEl.querySelectorAll("[data-consume]").forEach((btn) => {
    btn.addEventListener("click", () => openConsumedModal(Number(btn.dataset.consume)));
  });
  contentEl.querySelectorAll("[data-discard]").forEach((btn) => {
    btn.addEventListener("click", () => {
      markJete(Number(btn.dataset.discard));
      refresh();
    });
  });
}

function renderCard(item) {
  const days = daysUntil(item.peremption);
  const label = statusLabel(days);
  const urgent = days <= 3;

  return `
    <div class="item-card">
      <div class="item-image">
        ${item.image ? `<img src="${item.image}" alt="${escapeHtml(item.nom)}">` : `<span class="placeholder">🍽</span>`}
      </div>
      <div class="item-content">
        <div class="item-name">${escapeHtml(item.nom)}</div>
        ${item.quantite ? `<div class="item-quantite">${escapeHtml(item.quantite)}</div>` : ""}
        <div class="item-badges">
          <span class="badge">${escapeHtml(item.emplacement)}</span>
          ${label ? `<span class="badge${urgent ? " badge-urgent" : ""}">${label}</span>` : ""}
        </div>
        <div class="item-date">📅 ${formatDate(item.peremption)}</div>
        <div class="item-actions">
          <button class="btn-primary" data-consume="${item.id}">Consommé</button>
          <button class="btn-secondary" data-discard="${item.id}">Jeté</button>
        </div>
      </div>
    </div>
  `;
}

// ==== Rappels ====

function checkReminders(rows) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const notified = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || "{}");

  rows.forEach((item) => {
    const d = daysUntil(item.peremption);
    if (d <= 0 && !notified[item.id]) {
      new Notification("🛒 Mon frigo", {
        body: d === 0 ? `${item.nom} expire aujourd'hui !` : `${item.nom} est périmé !`,
      });
      notified[item.id] = true;
    }
  });

  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notified));
}

bellBtn.addEventListener("click", () => {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
});

// ==== Modal : ajouter ====

function buildAddFormOptions() {
  categorySelect.innerHTML = `<option value="">Choisir…</option>` + CATEGORIES.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");

  emplacementSegmented.innerHTML = EMPLACEMENTS
    .map((loc, i) => `<button type="button" class="seg-btn${i === 0 ? " active" : ""}" data-value="${escapeHtml(loc)}">${escapeHtml(loc)}</button>`)
    .join("");

  emplacementSegmented.querySelectorAll(".seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      emplacementSegmented.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      emplacementValue.value = btn.dataset.value;
    });
  });
}

function openAddModal() {
  addForm.reset();
  pendingImage = null;
  imagePreview.innerHTML = "";
  fileName.textContent = "Aucun fichier choisi";
  emplacementSegmented.querySelectorAll(".seg-btn").forEach((b, i) => b.classList.toggle("active", i === 0));
  emplacementValue.value = EMPLACEMENTS[0];
  addModal.classList.add("active");
}

function closeAddModal() {
  addModal.classList.remove("active");
}

fab.addEventListener("click", openAddModal);
document.getElementById("cancel-add").addEventListener("click", closeAddModal);
addModal.addEventListener("click", (e) => {
  if (e.target === addModal) closeAddModal();
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;
  fileName.textContent = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    pendingImage = e.target.result;
    imagePreview.innerHTML = `<img src="${pendingImage}" alt="Aperçu">`;
  };
  reader.readAsDataURL(file);
});

addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const nom = addForm.nom.value.trim();
  const quantite = addForm.quantite.value.trim();
  const type = addForm.type.value;
  const peremption = addForm.peremption.value;
  const emplacement = emplacementValue.value;
  if (!nom || !type || !peremption) return;

  insertAliment({ nom, quantite, type, emplacement, peremption, image: pendingImage });
  closeAddModal();
  refresh();
});

// ==== Modal : consommé ====

function openConsumedModal(id) {
  activeItemId = id;
  const item = getAliment(id);
  consumedItemName.textContent = item.nom;
  consumedModal.classList.add("active");
}

function closeConsumedModal() {
  consumedModal.classList.remove("active");
}

consumedModal.addEventListener("click", (e) => {
  if (e.target === consumedModal) closeConsumedModal();
});

document.getElementById("consumed-all-btn").addEventListener("click", () => {
  markConsumedFull(activeItemId);
  closeConsumedModal();
  refresh();
});

document.getElementById("consumed-partial-btn").addEventListener("click", () => {
  const item = getAliment(activeItemId);
  closeConsumedModal();
  partialItemName.textContent = item.nom;
  partialStockLabel.textContent = `Quantité consommée (en stock : ${item.quantite || "?"})`;
  partialInput.value = "";
  partialModal.classList.add("active");
  partialInput.focus();
});

// ==== Modal : quantité partielle ====

function closePartialModal() {
  partialModal.classList.remove("active");
}

partialModal.addEventListener("click", (e) => {
  if (e.target === partialModal) closePartialModal();
});

document.getElementById("cancel-partial").addEventListener("click", closePartialModal);

document.getElementById("confirm-partial-btn").addEventListener("click", () => {
  const value = partialInput.value.trim();
  if (!value) return;
  markConsumedPartial(activeItemId, value);
  closePartialModal();
  refresh();
});

// ==== Recherche ====

searchInput.addEventListener("input", () => {
  searchText = searchInput.value;
  refresh();
});

// ==== Export / Import ====

document.getElementById("export-btn").addEventListener("click", () => {
  exportDatabase();
  setStatus("Fichier .db exporté.");
});

document.getElementById("import-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    setStatus("Import en cours…");
    await loadDatabaseFromFile(file);
    refresh();
    setStatus(`Base "${file.name}" importée.`);
  } catch (err) {
    setStatus("Erreur d'import : " + err.message, true);
  }
});

// ==== Sauvegarde disque ====

const diskSyncBtn = document.getElementById("disk-sync-btn");

function updateDiskSyncLabel(active) {
  diskSyncBtn.textContent = active ? "💾 Sauvegarde disque active" : "💾 Activer la sauvegarde disque";
}

diskSyncBtn.addEventListener("click", async () => {
  try {
    await enableDiskSync();
    updateDiskSyncLabel(true);
    setStatus("Sauvegarde disque activée — food.db sera tenu à jour dans le dossier choisi.");
  } catch (err) {
    setStatus("Erreur : " + err.message, true);
  }
});

// ==== Navigation ====

function switchView(view) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById(`view-${view}`).classList.add("active");
  navBtns.forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  fab.hidden = view !== "frigo";

  if (view === "frigo") refresh();
  else if (view === "courses") renderCourses();
  else if (view === "historique") renderHistorique();
}

navBtns.forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

// ==== Liste de courses ====

function renderCourses() {
  const rows = getCourses();
  const restant = rows.filter((r) => !r.achete).length;
  const achetes = rows.length - restant;

  coursesSummaryEl.textContent = rows.length === 0
    ? "Aucun article"
    : `${restant} à acheter · ${achetes} acheté${achetes > 1 ? "s" : ""}`;

  if (rows.length === 0) {
    coursesListEl.innerHTML = `<p class="empty">Liste de courses vide</p>`;
    return;
  }

  coursesListEl.innerHTML = rows
    .map((item) => `
      <div class="course-item${item.achete ? " achete" : ""}">
        <button class="course-check" data-toggle="${item.id}" data-achete="${item.achete}" aria-label="Marquer acheté">${item.achete ? "✓" : ""}</button>
        <div>
          <div class="course-name">${escapeHtml(item.nom)}</div>
          ${item.type ? `<div class="course-type">${escapeHtml(item.type)}</div>` : ""}
        </div>
        <button class="course-delete" data-delete="${item.id}" aria-label="Supprimer">✕</button>
      </div>
    `)
    .join("");

  coursesListEl.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const achete = btn.dataset.achete === "1";
      toggleCourseAchete(Number(btn.dataset.toggle), !achete);
      renderCourses();
    });
  });

  coursesListEl.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      deleteCourse(Number(btn.dataset.delete));
      renderCourses();
    });
  });
}

courseForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const nom = courseInput.value.trim();
  if (!nom) return;
  insertCourse(nom, null);
  courseForm.reset();
  renderCourses();
});

clearAchetesBtn.addEventListener("click", () => {
  clearAchetes();
  renderCourses();
});

// ==== Historique ====

function renderHistorique() {
  const rows = getHistorique();

  if (rows.length === 0) {
    historiqueListEl.innerHTML = `<p class="empty">Aucun historique pour le moment</p>`;
    return;
  }

  historiqueListEl.innerHTML = rows
    .map((item) => `
      <div class="history-item">
        <div class="history-thumb">
          ${item.image ? `<img src="${item.image}" alt="${escapeHtml(item.nom)}">` : `<span class="placeholder">🍽</span>`}
        </div>
        <div class="history-info">
          <div class="history-name">${escapeHtml(item.nom)}${item.quantite ? ` · ${escapeHtml(item.quantite)}` : ""}</div>
          <div class="history-meta">
            <span class="badge ${item.statut === "consomme" ? "badge-consomme" : "badge-jete"}">${item.statut === "consomme" ? "Consommé" : "Jeté"}</span>
            ${escapeHtml(item.type)}${item.resolu_le ? ` · ${formatDate(item.resolu_le)}` : ""}
          </div>
        </div>
        <button class="add-to-list-btn" data-repeat data-nom="${escapeHtml(item.nom)}" data-type="${escapeHtml(item.type)}">+ Courses</button>
      </div>
    `)
    .join("");

  historiqueListEl.querySelectorAll("[data-repeat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      insertCourse(btn.dataset.nom, btn.dataset.type);
      setStatus(`"${btn.dataset.nom}" ajouté à la liste de courses.`);
    });
  });
}

// ==== Démarrage ====

async function boot() {
  try {
    setStatus("Initialisation de la base…");
    buildAddFormOptions();
    await initDatabase();
    updateDiskSyncLabel(!!diskDirHandle);
    setStatus("Données enregistrées localement");
    refresh();
    setInterval(refresh, 3600000);
  } catch (err) {
    setStatus("Erreur d'initialisation : " + err.message, true);
  }
}

boot();
