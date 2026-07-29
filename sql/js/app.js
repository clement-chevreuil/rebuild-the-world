const tableBody = document.querySelector("#modeles-table tbody");
const form = document.getElementById("add-form");
const statusEl = document.getElementById("status");
const importInput = document.getElementById("import-file");

function refreshTable() {
  const rows = getAllModeles();
  tableBody.innerHTML = "";

  if (rows.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="empty">Aucune donnée pour le moment.</td></tr>`;
    return;
  }

  for (const row of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.id}</td>
      <td>${escapeHtml(row.titre)}</td>
      <td>${row.ordre ?? ""}</td>
      <td>${escapeHtml(row.cree_le ?? "")}</td>
      <td><button class="delete-btn" data-id="${row.id}">Supprimer</button></td>
    `;
    tableBody.appendChild(tr);
  }

  tableBody.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      deleteModele(Number(btn.dataset.id));
      refreshTable();
    });
  });
}

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

async function boot() {
  try {
    setStatus("Initialisation de la base…");
    await initDatabase();
    setStatus("Base prête — sauvegardée automatiquement sur cet appareil.");
    refreshTable();
  } catch (err) {
    setStatus("Erreur d'initialisation : " + err.message, true);
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const titre = form.titre.value.trim();
  if (!titre) return;

  insertModele({
    titre,
    ordre: form.ordre.value ? Number(form.ordre.value) : null,
  });

  form.reset();
  refreshTable();
});

document.getElementById("export-btn").addEventListener("click", () => {
  exportDatabase();
  setStatus("Fichier .db exporté.");
});

importInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    setStatus("Import en cours…");
    await loadDatabaseFromFile(file);
    refreshTable();
    setStatus(`Base "${file.name}" importée.`);
  } catch (err) {
    setStatus("Erreur d'import : " + err.message, true);
  }
});

boot();
