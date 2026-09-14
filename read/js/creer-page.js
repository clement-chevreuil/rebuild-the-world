const STORAGE_KEY = "document-pages-list";

const form = document.getElementById("create-form");
const resultEl = document.getElementById("result");
const existingListEl = document.getElementById("existing-list");

// ==== Gestion de la liste des pages (mémorisée dans localStorage) ====

function getStoredPages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [{ slug: "exemple", titre: "Exemple" }];
  } catch {
    return [{ slug: "exemple", titre: "Exemple" }];
  }
}

function saveStoredPages(pages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
}

function slugify(titre) {
  const base = titre
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // enlève les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "page";
}

function uniqueSlug(base, pages) {
  let slug = base;
  let i = 2;
  while (pages.some((p) => p.slug === slug)) {
    slug = `${base}-${i}`;
    i++;
  }
  return slug;
}

function renderExistingList() {
  const pages = getStoredPages();
  existingListEl.innerHTML = "";
  if (pages.length === 0) {
    existingListEl.innerHTML = `<li class="empty">Aucune page pour le moment.</li>`;
    return;
  }
  for (const p of pages) {
    const li = document.createElement("li");
    li.textContent = `${p.titre}  (pages/${p.slug}/)`;
    existingListEl.appendChild(li);
  }
}

// ==== Génération des fichiers ====

function escapeForTemplateLiteral(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}

function buildContentJs(contenu, isMarkdown) {
  return `// Fichier généré par creer-page.html — édite librement le texte ci-dessous.

const IS_MARKDOWN = ${isMarkdown ? "true" : "false"};

const CONTENT = \`${escapeForTemplateLiteral(contenu)}\`;
`;
}

function buildPageHtml(titre) {
  const safeTitre = titre.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeTitre}</title>
<link rel="stylesheet" href="../../../vendor-pack/vendor/bootstrap/bootstrap.min.css">
<link rel="stylesheet" href="../../css/style.css">
</head>
<body>

  <main class="page">
    <a href="../../index.html" class="back-link no-print">← Retour au menu</a>

    <section class="toolbar no-print">
      <button id="export-txt">⬇ .txt</button>
      <button id="export-md">⬇ .md</button>
      <button id="export-pdf">🖨 .pdf</button>
    </section>

    <article id="content" class="content">
      <p class="loading">Chargement…</p>
    </article>
  </main>

  <script src="content.js"></script>
  <script src="../../js/script.js"></script>
</body>
</html>
`;
}

function buildManifestJs(pages) {
  const entries = pages
    .map((p) => `  { slug: ${JSON.stringify(p.slug)}, titre: ${JSON.stringify(p.titre)} },`)
    .join("\n");
  return `// Liste de toutes les pages du site. Ce fichier est régénéré automatiquement
// par l'outil creer-page.html à chaque nouvelle page créée — ne pas éditer
// à la main, sauf pour corriger un titre ou l'ordre.

const PAGES = [
${entries}
];
`;
}

function downloadText(text, filename) {
  const blob = new Blob([text], { type: "text/javascript;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const titre = form.titre.value.trim();
  const contenu = form.contenu.value;
  const isMarkdown = form.isMarkdown.checked;
  if (!titre || !contenu) return;

  const pages = getStoredPages();
  const slug = uniqueSlug(slugify(titre), pages);
  const updatedPages = [...pages, { slug, titre }];

  const contentJs = buildContentJs(contenu, isMarkdown);
  const pageHtml = buildPageHtml(titre);
  const manifestJs = buildManifestJs(updatedPages);

  // Trois téléchargements : les 2 fichiers de la nouvelle page + le manifeste à jour
  downloadText(pageHtml, "index.html");
  setTimeout(() => downloadText(contentJs, "content.js"), 300);
  setTimeout(() => downloadText(manifestJs, "pages-manifest.js"), 600);

  saveStoredPages(updatedPages);
  renderExistingList();

  resultEl.innerHTML = `
    <p class="success">
      3 fichiers téléchargés :<br>
      1. Crée un dossier <code>pages/${slug}/</code><br>
      2. Mets-y <code>index.html</code> et <code>content.js</code><br>
      3. Remplace <code>pages-manifest.js</code> à la racine du site (à côté de l'autre <code>index.html</code>)
    </p>
  `;

  form.reset();
});

renderExistingList();
