const contentEl = document.getElementById("content");
const toolbar = document.querySelector(".toolbar");
const editForm = document.getElementById("edit-form");

const docId = Number(new URLSearchParams(window.location.search).get("id"));
let currentDoc = null;

function slugify(titre) {
  const base = titre
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // enlève les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "document";
}

// ==== Affichage ====

function renderDocument() {
  currentDoc = getDocument(docId);

  if (!currentDoc) {
    document.title = "Document introuvable";
    contentEl.innerHTML = `<p class="error">Ce document n'existe pas (ou plus) dans la base.</p>`;
    toolbar.hidden = true;
    return;
  }

  document.title = currentDoc.titre;
  const corps = currentDoc.is_markdown
    ? renderMarkdown(currentDoc.contenu)
    : renderPlainText(currentDoc.contenu);

  // Le titre stocké en base sert d'en-tête, sauf si le contenu commence déjà
  // par un titre de niveau 1 (cas courant d'un .md importé) — sinon on en aurait deux.
  const enTete = corps.startsWith("<h1>")
    ? ""
    : `<h1>${currentDoc.titre.replace(/</g, "&lt;")}</h1>`;
  contentEl.innerHTML = enTete + corps;
}

// ==== Édition ====

function openEditor() {
  editForm.titre.value = currentDoc.titre;
  editForm.contenu.value = currentDoc.contenu;
  editForm.is_markdown.checked = !!currentDoc.is_markdown;
  editForm.hidden = false;
  contentEl.hidden = true;
  editForm.titre.focus();
}

function closeEditor() {
  editForm.hidden = true;
  contentEl.hidden = false;
}

document.getElementById("edit-btn").addEventListener("click", openEditor);
document.getElementById("cancel-edit").addEventListener("click", closeEditor);

editForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const titre = editForm.titre.value.trim();
  if (!titre) return;

  updateDocument(docId, {
    titre,
    contenu: editForm.contenu.value,
    is_markdown: editForm.is_markdown.checked,
  });

  closeEditor();
  renderDocument();
});

document.getElementById("delete-btn").addEventListener("click", () => {
  if (!confirm(`Supprimer définitivement « ${currentDoc.titre} » ?`)) return;
  deleteDocument(docId);
  window.location.href = "../index.html";
});

// ==== Exports ====

document.getElementById("export-txt").addEventListener("click", () => {
  const texte = currentDoc.is_markdown ? stripMarkdown(currentDoc.contenu) : currentDoc.contenu;
  downloadBlob(texte, `${slugify(currentDoc.titre)}.txt`, "text/plain;charset=utf-8");
});

document.getElementById("export-md").addEventListener("click", () => {
  downloadBlob(currentDoc.contenu, `${slugify(currentDoc.titre)}.md`, "text/markdown;charset=utf-8");
});

document.getElementById("export-pdf").addEventListener("click", () => {
  // Solution 100% native : boîte d'impression du navigateur
  // (sur Android/Chrome, elle propose "Enregistrer en PDF")
  window.print();
});

// ==== Démarrage ====

initDatabase()
  .then(renderDocument)
  .catch((err) => {
    contentEl.innerHTML = `<p class="error">Erreur au chargement de la base : ${err.message}</p>`;
  });
