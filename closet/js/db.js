let db = null;
const manager = SQLiteManager.createManager("closet");
const DISK_SYNC_KEY = "closet-dir";
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

function persist() {
  manager.saveToLocalStorage();
  syncToDisk().catch((err) => console.error("Échec de la sauvegarde disque :", err));
}

function rowsFromResult(res) {
  if (res.length === 0) return [];
  const [{ columns, values }] = res;
  return values.map((row) => Object.fromEntries(row.map((v, i) => [columns[i], v])));
}

// ==== Requêtes ====

function getArticles({ categorie, search } = {}) {
  let sql = "SELECT * FROM articles WHERE 1=1";
  const params = [];

  if (categorie && categorie !== "Toutes") {
    sql += " AND categorie = ?";
    params.push(categorie);
  }
  if (search) {
    sql += " AND (nom LIKE ? OR type LIKE ? OR textile LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  sql += " ORDER BY ajoute_le DESC, id DESC";

  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function getArticle(id) {
  const stmt = db.prepare("SELECT * FROM articles WHERE id = ?");
  stmt.bind([id]);
  let row = null;
  if (stmt.step()) row = stmt.getAsObject();
  stmt.free();
  return row;
}

function insertArticle(data) {
  const stmt = db.prepare(`
    INSERT INTO articles (nom, categorie, type, textile, image, symbole_lavage, symbole_blanchiment, symbole_sechage, symbole_repassage, symbole_pressing)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run([
    data.nom,
    data.categorie,
    data.type || null,
    data.textile || null,
    data.image || null,
    data.symbole_lavage || null,
    data.symbole_blanchiment || null,
    data.symbole_sechage || null,
    data.symbole_repassage || null,
    data.symbole_pressing || null,
  ]);
  stmt.free();
  persist();
}

function updateArticle(id, data) {
  const stmt = db.prepare(`
    UPDATE articles SET
      nom = ?, categorie = ?, type = ?, textile = ?, image = ?,
      symbole_lavage = ?, symbole_blanchiment = ?, symbole_sechage = ?, symbole_repassage = ?, symbole_pressing = ?
    WHERE id = ?
  `);
  stmt.run([
    data.nom,
    data.categorie,
    data.type || null,
    data.textile || null,
    data.image || null,
    data.symbole_lavage || null,
    data.symbole_blanchiment || null,
    data.symbole_sechage || null,
    data.symbole_repassage || null,
    data.symbole_pressing || null,
    id,
  ]);
  stmt.free();
  persist();
}

function deleteArticle(id) {
  db.run("DELETE FROM articles WHERE id = ?", [id]);
  persist();
}

function exportDatabase() {
  manager.exportToFile(EXPORT_FILENAME);
}

async function loadDatabaseFromFile(file) {
  await manager.importFromFile(file, (await manager.init(SQL_WASM_BASE64, SCHEMA_SQL)).sqlEngine);
  db = manager.getDatabase();
  persist();
}

async function initDatabase() {
  const result = await manager.init(SQL_WASM_BASE64, SCHEMA_SQL);
  db = result.db;
  await initDiskSync();
  persist();
  return db;
}
