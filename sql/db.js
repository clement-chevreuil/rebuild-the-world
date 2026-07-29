// ==== Initialisation du moteur SQLite (WASM), 100% hors-ligne ====

let db = null;
let SQL_ENGINE = null; // instance sql.js réutilisée entre les opérations

function base64ToUint8Array(base64) {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes) {
  let binaryStr = "";
  for (let i = 0; i < bytes.length; i++) {
    binaryStr += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryStr);
}

function seedIfEmpty() {
  const res = db.exec("SELECT COUNT(*) FROM modeles");
  const count = res[0].values[0][0];
  if (count === 0) {
    db.run(SEED_SQL);
  }
}

// ==== Auto-sauvegarde dans localStorage (persiste entre les rechargements) ====
function saveToLocalStorage() {
  try {
    const bytes = db.export();
    localStorage.setItem(LOCAL_STORAGE_KEY, uint8ArrayToBase64(bytes));
  } catch (err) {
    console.error("Échec de l'auto-sauvegarde localStorage :", err);
  }
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) return null;
  return base64ToUint8Array(saved);
}

async function initDatabase() {
  const wasmBinary = base64ToUint8Array(SQL_WASM_BASE64);

  // initSqlJs est fourni par sql-wasm.js. On lui passe directement le
  // binaire WASM déjà en mémoire pour éviter tout fetch (bloqué en file://).
  SQL_ENGINE = await initSqlJs({ wasmBinary });

  const saved = loadFromLocalStorage();

  if (saved) {
    // Une sauvegarde existe déjà (session précédente ou import antérieur)
    db = new SQL_ENGINE.Database(saved);
    db.run(SCHEMA_SQL); // s'assure que la table existe toujours
  } else {
    // Premier lancement : base vierge + seed
    db = new SQL_ENGINE.Database();
    db.run(SCHEMA_SQL);
    seedIfEmpty();
    saveToLocalStorage();
  }

  return db;
}

// ==== Import d'un fichier .db existant (remplace la base en mémoire ET la sauvegarde) ====
async function loadDatabaseFromFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  db = new SQL_ENGINE.Database(new Uint8Array(arrayBuffer));
  db.run(SCHEMA_SQL); // s'assure que la table existe si le fichier importé est vide/différent
  seedIfEmpty(); // seulement si le .db importé est vide
  saveToLocalStorage(); // le fichier importé remplace la sauvegarde locale
}

// ==== Requêtes ====
function getAllModeles() {
  const res = db.exec("SELECT id, titre, ordre, cree_le FROM modeles ORDER BY ordre ASC, id ASC");
  if (res.length === 0) return [];
  const [{ columns, values }] = res;
  return values.map((row) =>
    Object.fromEntries(row.map((v, i) => [columns[i], v]))
  );
}

function insertModele({ titre, ordre }) {
  const stmt = db.prepare(
    "INSERT INTO modeles (titre, ordre) VALUES (?, ?)"
  );
  stmt.run([titre, ordre !== null && ordre !== undefined ? ordre : null]);
  stmt.free();
  saveToLocalStorage();
}

function deleteModele(id) {
  db.run("DELETE FROM modeles WHERE id = ?", [id]);
  saveToLocalStorage();
}

// ==== Export du fichier .db ====
function exportDatabase() {
  const data = db.export(); // Uint8Array
  const blob = new Blob([data], { type: "application/x-sqlite3" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = EXPORT_FILENAME;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
