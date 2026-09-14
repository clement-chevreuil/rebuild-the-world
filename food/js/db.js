let db = null;
const manager = SQLiteManager.createManager("food");
const DISK_SYNC_KEY = "food-dir";
let diskDirHandle = null;

// ==== Sauvegarde disque (en plus de localStorage) ====
async function initDiskSync() {
  diskDirHandle = await DiskSync.getStoredDirectory(DISK_SYNC_KEY);
  return !!diskDirHandle;
}

async function enableDiskSync() {
  diskDirHandle = await DiskSync.pickDirectory(DISK_SYNC_KEY);
  await syncToDisk();
}

async function syncToDisk() {
  if (!diskDirHandle || !db) return;
  await DiskSync.writeFile(diskDirHandle, EXPORT_FILENAME, db.export());
}

// Sauvegarde à la fois en localStorage et (si activé) sur disque en food.db
function persist() {
  manager.saveToLocalStorage();
  syncToDisk().catch((err) => console.error("Échec de la sauvegarde disque :", err));
}

// Ajoute les colonnes manquantes sur une base déjà existante (ancien schéma)
function migrateSchema() {
  const res = db.exec("PRAGMA table_info(aliments)");
  const cols = res.length ? res[0].values.map((r) => r[1]) : [];
  const wanted = [
    ["quantite", "TEXT"],
    ["emplacement", "TEXT NOT NULL DEFAULT 'Frigo'"],
    ["statut", "TEXT NOT NULL DEFAULT 'actif'"],
    ["resolu_le", "TEXT"],
  ];
  wanted.forEach(([name, def]) => {
    if (!cols.includes(name)) {
      db.run(`ALTER TABLE aliments ADD COLUMN ${name} ${def}`);
    }
  });
}

function seedIfEmpty() {
  if (!SEED_SQL) return;
  const res = db.exec("SELECT COUNT(*) FROM aliments");
  const count = res[0].values[0][0];
  if (count === 0) {
    db.run(SEED_SQL);
  }
}

// ==== Requêtes ====
function getActiveAliments() {
  const res = db.exec(
    "SELECT id, nom, quantite, type, emplacement, peremption, image, statut FROM aliments WHERE statut='actif' ORDER BY peremption ASC, id ASC"
  );
  if (res.length === 0) return [];
  const [{ columns, values }] = res;
  return values.map((row) =>
    Object.fromEntries(row.map((v, i) => [columns[i], v]))
  );
}

function getAliment(id) {
  const stmt = db.prepare("SELECT * FROM aliments WHERE id = ?");
  stmt.bind([id]);
  let row = null;
  if (stmt.step()) row = stmt.getAsObject();
  stmt.free();
  return row;
}

function insertAliment({ nom, quantite, type, emplacement, peremption, image }) {
  const stmt = db.prepare(
    "INSERT INTO aliments (nom, quantite, type, emplacement, peremption, image) VALUES (?, ?, ?, ?, ?, ?)"
  );
  stmt.run([nom, quantite || null, type, emplacement, peremption, image || null]);
  stmt.free();
  persist();
}

function markConsumedFull(id) {
  db.run("UPDATE aliments SET statut='consomme', resolu_le=datetime('now') WHERE id = ?", [id]);
  persist();
}

function markJete(id) {
  db.run("UPDATE aliments SET statut='jete', resolu_le=datetime('now') WHERE id = ?", [id]);
  persist();
}

// Extrait un nombre + une unité d'une quantité libre ("200g" -> {value:200, unit:"g"})
function parseQuantite(str) {
  if (!str) return null;
  const m = String(str).trim().match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!m) return null;
  return { value: parseFloat(m[1].replace(",", ".")), unit: m[2].trim().toLowerCase() };
}

// Consommation partielle : enregistre la portion consommée comme un aliment résolu,
// et met à jour (ou clôture) l'aliment restant avec la nouvelle quantité.
function markConsumedPartial(id, consumedStr) {
  const item = getAliment(id);
  if (!item) return;

  const stmt = db.prepare(
    "INSERT INTO aliments (nom, quantite, type, emplacement, peremption, image, statut, resolu_le) VALUES (?, ?, ?, ?, ?, ?, 'consomme', datetime('now'))"
  );
  stmt.run([item.nom, consumedStr, item.type, item.emplacement, item.peremption, item.image]);
  stmt.free();

  const original = parseQuantite(item.quantite);
  const consumed = parseQuantite(consumedStr);

  if (original && consumed && original.unit === consumed.unit && consumed.value < original.value) {
    const remaining = original.value - consumed.value;
    const remainingStr = remaining % 1 === 0 ? String(remaining) : remaining.toFixed(2);
    const unitSuffix = item.quantite.replace(/^[\d.,]+\s*/, "");
    db.run("UPDATE aliments SET quantite = ? WHERE id = ?", [remainingStr + unitSuffix, id]);
  } else if (original && consumed && original.unit === consumed.unit && consumed.value >= original.value) {
    db.run("UPDATE aliments SET statut='consomme', resolu_le=datetime('now') WHERE id = ?", [id]);
  }
  // Sinon (quantité non interprétable) : l'aliment restant n'est pas modifié,
  // seule la portion consommée est enregistrée.

  persist();
}

function getHistorique() {
  const res = db.exec(
    "SELECT id, nom, quantite, type, emplacement, peremption, image, statut, resolu_le FROM aliments WHERE statut IN ('consomme', 'jete') ORDER BY resolu_le DESC, id DESC"
  );
  if (res.length === 0) return [];
  const [{ columns, values }] = res;
  return values.map((row) =>
    Object.fromEntries(row.map((v, i) => [columns[i], v]))
  );
}

// ==== Liste de courses ====
function getCourses() {
  const res = db.exec("SELECT id, nom, type, achete FROM courses ORDER BY achete ASC, id ASC");
  if (res.length === 0) return [];
  const [{ columns, values }] = res;
  return values.map((row) =>
    Object.fromEntries(row.map((v, i) => [columns[i], v]))
  );
}

function insertCourse(nom, type) {
  const stmt = db.prepare("INSERT INTO courses (nom, type) VALUES (?, ?)");
  stmt.run([nom, type || null]);
  stmt.free();
  persist();
}

function toggleCourseAchete(id, achete) {
  db.run("UPDATE courses SET achete = ? WHERE id = ?", [achete ? 1 : 0, id]);
  persist();
}

function deleteCourse(id) {
  db.run("DELETE FROM courses WHERE id = ?", [id]);
  persist();
}

function clearAchetes() {
  db.run("DELETE FROM courses WHERE achete = 1");
  persist();
}

function exportDatabase() {
  manager.exportToFile(EXPORT_FILENAME);
}

async function loadDatabaseFromFile(file) {
  await manager.importFromFile(file, (await manager.init(SQL_WASM_BASE64, SCHEMA_SQL, seedIfEmpty)).sqlEngine);
  db = manager.getDatabase();
  migrateSchema();
  seedIfEmpty();
  persist();
}

async function initDatabase() {
  const result = await manager.init(SQL_WASM_BASE64, SCHEMA_SQL, seedIfEmpty);
  db = result.db;
  migrateSchema();
  await initDiskSync();
  persist();
  return db;
}
