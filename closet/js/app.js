const summaryEl = document.getElementById("summary");
const statusEl = document.getElementById("status");
const searchInput = document.getElementById("search-input");
const categoryPillsEl = document.getElementById("category-pills");
const contentEl = document.getElementById("content");

const fab = document.getElementById("fab");
const articleModal = document.getElementById("article-modal");
const modalTitle = document.getElementById("modal-title");
const articleForm = document.getElementById("article-form");
const categorieSegmented = document.getElementById("categorie-segmented");
const categorieValue = document.getElementById("categorie-value");
const typeInput = document.getElementById("type-input");
const typeSuggestions = document.getElementById("type-suggestions");
const textileSelect = document.getElementById("textile-select");
const imageInput = document.getElementById("image-input");
const imagePreview = document.getElementById("image-preview");
const fileName = document.getElementById("file-name");
const carePickersEl = document.getElementById("care-pickers");

const legendBtn = document.getElementById("legend-btn");
const legendModal = document.getElementById("legend-modal");
const legendContent = document.getElementById("legend-content");
const closeLegendBtn = document.getElementById("close-legend");

let filterCategorie = "Toutes";
let searchText = "";
let pendingImage = null;
let editingId = null;
let careSelection = {};

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

// ==== Filtres ====

function buildPills() {
  categoryPillsEl.innerHTML = ["Toutes", ...getCategories()]
    .map((cat) => `<button class="pill${cat === filterCategorie ? " active" : ""}" data-cat="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`)
    .join("");

  categoryPillsEl.querySelectorAll(".pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      filterCategorie = btn.dataset.cat;
      refresh();
    });
  });
}

// ==== Rendu ====

function refresh() {
  buildPills();
  const rows = getArticles({ categorie: filterCategorie, search: searchText.trim() });
  const total = getArticles({}).length;

  summaryEl.textContent = `${total} article${total > 1 ? "s" : ""}`;
  renderContent(rows);
}

function renderContent(rows) {
  if (rows.length === 0) {
    contentEl.innerHTML = `<p class="empty">Aucun article pour le moment</p>`;
    return;
  }

  contentEl.innerHTML = `<div class="items-grid">${rows.map(renderCard).join("")}</div>`;

  contentEl.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openEditModal(Number(btn.dataset.edit)));
  });
  contentEl.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (confirm("Supprimer cet article ?")) {
        deleteArticle(Number(btn.dataset.delete));
        refresh();
      }
    });
  });
}

function renderCareIcons(item) {
  const icons = CARE_FIELDS
    .map((field) => item[`symbole_${field}`])
    .filter(Boolean)
    .map((file) => {
      const opt = Object.values(CARE_OPTIONS).flat().find((o) => o.file === file);
      const label = opt ? opt.label : file;
      return `<img src="svg/${file}" alt="${escapeHtml(label)}" title="${escapeHtml(label)}">`;
    });

  if (icons.length === 0) return `<div class="item-care"><span class="no-care">Aucun entretien renseigné</span></div>`;
  return `<div class="item-care">${icons.join("")}</div>`;
}

function renderCard(item) {
  return `
    <div class="item-card">
      <div class="item-image">
        ${item.image ? `<img src="${item.image}" alt="${escapeHtml(item.nom)}">` : `<span class="placeholder">👕</span>`}
      </div>
      <div class="item-content">
        <div class="item-name">${escapeHtml(item.nom)}</div>
        ${item.type || item.textile ? `<div class="item-meta">${escapeHtml([item.type, item.textile].filter(Boolean).join(" · "))}</div>` : ""}
        <div class="item-badges">
          <span class="badge">${escapeHtml(item.categorie)}</span>
        </div>
        ${renderCareIcons(item)}
        <div class="item-actions">
          <button class="btn-secondary" data-edit="${item.id}">Modifier</button>
          <button class="btn-secondary" data-delete="${item.id}">Supprimer</button>
        </div>
      </div>
    </div>
  `;
}

// ==== Modal : ajouter / modifier ====

function buildCategorieSegmented() {
  categorieSegmented.innerHTML = getCategories()
    .map((cat, i) => `<button type="button" class="seg-btn${i === 0 ? " active" : ""}" data-value="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`)
    .join("");

  categorieSegmented.querySelectorAll(".seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      categorieSegmented.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      categorieValue.value = btn.dataset.value;
      updateTypeSuggestions(btn.dataset.value);
    });
  });
}

function updateTypeSuggestions(categorie) {
  const suggestions = getTypes(categorie);
  typeSuggestions.innerHTML = suggestions.map((t) => `<option value="${escapeHtml(t)}">`).join("");
}

function buildTextileOptions() {
  textileSelect.innerHTML = `<option value="">Choisir…</option>` + TEXTILES.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
}

function renderCarePickers() {
  carePickersEl.innerHTML = CARE_FIELDS
    .map((field) => {
      const options = CARE_OPTIONS[field];
      const selected = careSelection[field] || "";
      return `
        <div class="care-group">
          <div class="care-group-label">${CARE_LABELS[field]}</div>
          <div class="icon-picker" data-field="${field}">
            <button type="button" class="icon-option${!selected ? " active" : ""}" data-value="">
              <span class="icon-none">–</span>
              <span class="icon-label">Non précisé</span>
            </button>
            ${options
              .map(
                (opt) => `
              <button type="button" class="icon-option${selected === opt.file ? " active" : ""}" data-value="${opt.file}" title="${escapeHtml(opt.label)}">
                <img src="svg/${opt.file}" alt="${escapeHtml(opt.label)}">
                <span class="icon-label">${escapeHtml(opt.label)}</span>
              </button>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    })
    .join("");

  carePickersEl.querySelectorAll(".icon-picker").forEach((picker) => {
    const field = picker.dataset.field;
    picker.querySelectorAll(".icon-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        careSelection[field] = btn.dataset.value || null;
        picker.querySelectorAll(".icon-option").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  });
}

function resetModal() {
  articleForm.reset();
  pendingImage = null;
  editingId = null;
  careSelection = {};
  imagePreview.innerHTML = "";
  fileName.textContent = "Aucun fichier choisi";
  const [firstCategorie] = getCategories();
  categorieSegmented.querySelectorAll(".seg-btn").forEach((b, i) => b.classList.toggle("active", i === 0));
  categorieValue.value = firstCategorie;
  updateTypeSuggestions(firstCategorie);
  renderCarePickers();
}

function openAddModal() {
  resetModal();
  modalTitle.textContent = "Ajouter un article";
  articleModal.classList.add("active");
}

function openEditModal(id) {
  resetModal();
  const item = getArticle(id);
  if (!item) return;

  editingId = id;
  modalTitle.textContent = "Modifier l'article";
  articleForm.nom.value = item.nom;

  categorieSegmented.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.value === item.categorie));
  categorieValue.value = item.categorie;
  updateTypeSuggestions(item.categorie);

  typeInput.value = item.type || "";
  textileSelect.value = item.textile || "";

  if (item.image) {
    pendingImage = item.image;
    imagePreview.innerHTML = `<img src="${item.image}" alt="Aperçu">`;
  }

  CARE_FIELDS.forEach((field) => {
    careSelection[field] = item[`symbole_${field}`] || null;
  });
  renderCarePickers();

  articleModal.classList.add("active");
}

function closeArticleModal() {
  articleModal.classList.remove("active");
}

fab.addEventListener("click", openAddModal);
document.getElementById("cancel-article").addEventListener("click", closeArticleModal);
articleModal.addEventListener("click", (e) => {
  if (e.target === articleModal) closeArticleModal();
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

articleForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const nom = articleForm.nom.value.trim();
  const categorie = categorieValue.value;
  if (!nom || !categorie) return;

  const data = {
    nom,
    categorie,
    type: typeInput.value.trim(),
    textile: textileSelect.value,
    image: pendingImage,
    symbole_lavage: careSelection.lavage,
    symbole_blanchiment: careSelection.blanchiment,
    symbole_sechage: careSelection.sechage,
    symbole_repassage: careSelection.repassage,
    symbole_pressing: careSelection.pressing,
  };

  if (editingId) {
    updateArticle(editingId, data);
  } else {
    insertArticle(data);
  }

  closeArticleModal();
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
    buildCategorieSegmented();
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
    setStatus("Sauvegarde disque activée — closet.db sera tenu à jour dans le dossier choisi.");
  } catch (err) {
    setStatus("Erreur : " + err.message, true);
  }
});

// ==== Récapitulatif des symboles ====

function renderLegend() {
  legendContent.innerHTML = CARE_FIELDS
    .map(
      (field) => `
      <div class="legend-group">
        <h3 class="legend-group-title">${escapeHtml(CARE_LABELS[field])}</h3>
        <ul class="legend-list">
          ${CARE_OPTIONS[field]
            .map(
              (opt) => `
            <li>
              <img src="svg/${opt.file}" alt="${escapeHtml(opt.label)}">
              <span>${escapeHtml(opt.label)}</span>
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
    `
    )
    .join("");
}

legendBtn.addEventListener("click", () => {
  renderLegend();
  legendModal.classList.add("active");
});

closeLegendBtn.addEventListener("click", () => legendModal.classList.remove("active"));
legendModal.addEventListener("click", (e) => {
  if (e.target === legendModal) legendModal.classList.remove("active");
});

// ==== Démarrage ====

async function boot() {
  try {
    setStatus("Initialisation de la base…");
    buildTextileOptions();
    await initDatabase();
    buildCategorieSegmented();
    updateDiskSyncLabel(!!diskDirHandle);
    setStatus("Données enregistrées localement");
    refresh();
  } catch (err) {
    setStatus("Erreur d'initialisation : " + err.message, true);
  }
}

boot();
