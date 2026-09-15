const listEl = document.getElementById("menu-list");
const summaryEl = document.getElementById("summary");
const statusEl = document.getElementById("status");
const searchEl = document.getElementById("search-input");

const modal = document.getElementById("doc-modal");
const modalTitle = document.getElementById("modal-title");
const form = document.getElementById("doc-form");

let searchTerm = "";

// ==== Rendu de la liste ====

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function render() {
  const docs = getDocuments({ search: searchTerm });
  const total = countDocuments();

  summaryEl.textContent =
    total === 0
      ? "Aucun document pour le moment"
      : `${total} document${total > 1 ? "s" : ""} en base`;

  listEl.innerHTML = "";

  if (docs.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = searchTerm
      ? "Aucun document ne correspond à cette recherche."
      : "Aucun document. Crée-en un, ou importe des fichiers .md.";
    listEl.appendChild(li);
    return;
  }

  for (const doc of docs) {
    const li = document.createElement("li");

    const a = document.createElement("a");
    a.href = `html/document.html?id=${doc.id}`;
    a.className = "menu-link";

    const titre = document.createElement("span");
    titre.className = "menu-titre";
    titre.textContent = doc.titre;

    const meta = document.createElement("span");
    meta.className = "menu-meta";
    meta.textContent = `${doc.is_markdown ? "Markdown" : "Texte brut"} · modifié le ${formatDate(doc.modifie_le)}`;

    a.appendChild(titre);
    a.appendChild(meta);
    li.appendChild(a);
    listEl.appendChild(li);
  }
}

// ==== Modal de création ====

function openModal() {
  form.reset();
  form.is_markdown.checked = true;
  modalTitle.textContent = "Nouveau document";
  modal.classList.add("open");
  form.titre.focus();
}

function closeModal() {
  modal.classList.remove("open");
}

document.getElementById("new-btn").addEventListener("click", openModal);
document.getElementById("cancel-doc").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const titre = form.titre.value.trim();
  if (!titre) return;

  const id = insertDocument({
    titre,
    contenu: form.contenu.value,
    is_markdown: form.is_markdown.checked,
  });

  closeModal();
  window.location.href = `html/document.html?id=${id}`;
});

// ==== Import de fichiers .md ====

// Le titre vient du premier titre Markdown (# …) s'il y en a un, sinon du nom du fichier.
function titreDepuisFichier(nomFichier, contenu) {
  const heading = contenu.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  return nomFichier.replace(/\.(md|markdown|txt)$/i, "").trim() || "Sans titre";
}

document.getElementById("import-md").addEventListener("change", async (e) => {
  const files = [...e.target.files];
  e.target.value = "";
  if (files.length === 0) return;

  let importes = 0;
  for (const file of files) {
    try {
      const contenu = await file.text();
      insertDocument({
        titre: titreDepuisFichier(file.name, contenu),
        contenu,
        is_markdown: !/\.txt$/i.test(file.name),
      });
      importes++;
    } catch (err) {
      console.error(`Échec de l'import de ${file.name} :`, err);
    }
  }

  render();
  statusEl.textContent =
    importes === files.length
      ? `${importes} fichier${importes > 1 ? "s" : ""} ajouté${importes > 1 ? "s" : ""} à la base`
      : `${importes} fichier(s) sur ${files.length} importé(s) — voir la console pour les erreurs`;
});

// ==== Recherche ====

searchEl.addEventListener("input", () => {
  searchTerm = searchEl.value.trim();
  render();
});

// ==== Import / export de la base ====

document.getElementById("export-btn").addEventListener("click", () => exportDatabase());

document.getElementById("import-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    await loadDatabaseFromFile(file);
    render();
    statusEl.textContent = "Base importée";
  } catch (err) {
    statusEl.textContent = `Import impossible : ${err.message}`;
  }
});

const diskBtn = document.getElementById("disk-sync-btn");

function refreshDiskButton(active) {
  if (!DiskSync.isSupported()) {
    diskBtn.hidden = true;
    return;
  }
  diskBtn.textContent = active
    ? `💾 Sauvegarde disque active (${EXPORT_FILENAME})`
    : "💾 Activer la sauvegarde disque";
}

diskBtn.addEventListener("click", async () => {
  try {
    await enableDiskSync();
    refreshDiskButton(true);
    statusEl.textContent = `Sauvegarde automatique vers ${EXPORT_FILENAME}`;
  } catch (err) {
    if (err.name !== "AbortError") statusEl.textContent = err.message;
  }
});

// ==== Démarrage ====

initDatabase()
  .then(() => {
    // initDatabase a déjà rétabli le dossier de sauvegarde s'il était autorisé
    refreshDiskButton(!!diskDirHandle);
    render();
  })
  .catch((err) => {
    listEl.innerHTML = `<li class="empty">Erreur au chargement de la base : ${err.message}</li>`;
  });
