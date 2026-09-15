let db = null;
const manager = SQLiteManager.createManager("read");
const DISK_SYNC_KEY = "read-dir";
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

// ==== Requêtes ====

function getDocuments({ search } = {}) {
  let sql = "SELECT id, titre, is_markdown, cree_le, modifie_le, length(contenu) AS taille FROM documents WHERE 1=1";
  const params = [];

  if (search) {
    sql += " AND (titre LIKE ? OR contenu LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like);
  }
  sql += " ORDER BY modifie_le DESC, id DESC";

  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function countDocuments() {
  return db.exec("SELECT COUNT(*) FROM documents")[0].values[0][0];
}

function getDocument(id) {
  const stmt = db.prepare("SELECT * FROM documents WHERE id = ?");
  stmt.bind([id]);
  let row = null;
  if (stmt.step()) row = stmt.getAsObject();
  stmt.free();
  return row;
}

function insertDocument(data) {
  const stmt = db.prepare(`
    INSERT INTO documents (titre, contenu, is_markdown)
    VALUES (?, ?, ?)
  `);
  stmt.run([data.titre, data.contenu || "", data.is_markdown ? 1 : 0]);
  stmt.free();
  const id = db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0];
  persist();
  return id;
}

function updateDocument(id, data) {
  const stmt = db.prepare(`
    UPDATE documents SET
      titre = ?, contenu = ?, is_markdown = ?, modifie_le = datetime('now')
    WHERE id = ?
  `);
  stmt.run([data.titre, data.contenu || "", data.is_markdown ? 1 : 0, id]);
  stmt.free();
  persist();
}

function deleteDocument(id) {
  db.run("DELETE FROM documents WHERE id = ?", [id]);
  persist();
}

// ==== Import / export de la base ====

function exportDatabase() {
  manager.exportToFile(EXPORT_FILENAME);
}

async function loadDatabaseFromFile(file) {
  await manager.importFromFile(file, (await manager.init(SQL_WASM_BASE64, SCHEMA_SQL)).sqlEngine);
  db = manager.getDatabase();
  persist();
}

function seedDatabase(database) {
  const stmt = database.prepare("INSERT INTO documents (titre, contenu, is_markdown) VALUES (?, ?, ?)");
  stmt.run([SEED_DOCUMENT.titre, SEED_DOCUMENT.contenu, SEED_DOCUMENT.is_markdown]);
  stmt.free();
}

async function initDatabase() {
  const result = await manager.init(SQL_WASM_BASE64, SCHEMA_SQL, seedDatabase);
  db = result.db;
  await initDiskSync();
  persist();
  return db;
}
