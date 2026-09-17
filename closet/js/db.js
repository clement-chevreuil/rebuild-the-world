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

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

// Reprend les anciennes valeurs de articles.textile dans article_textiles (une seule fois)
function migrateSchema() {
  const res = db.exec("SELECT id, textile FROM articles WHERE textile IS NOT NULL AND TRIM(textile) <> ''");
  if (!res.length) return;

  const stmt = db.prepare(`
    INSERT INTO article_textiles (article_id, textile, pourcentage)
    SELECT ?, ?, 100 WHERE NOT EXISTS (SELECT 1 FROM article_textiles WHERE article_id = ?)
  `);
  res[0].values.forEach(([id, textile]) => {
    stmt.run([id, textile, id]);
  });
  stmt.free();
}

// ==== Catégories / types ====

function getCategories() {
  return queryAll("SELECT id, nom FROM categories ORDER BY ordre, nom").map((c) => c.nom);
}

function getTypes(categorie) {
  return queryAll(
    `SELECT t.nom FROM types t
     JOIN categories c ON c.id = t.categorie_id
     WHERE c.nom = ?
     ORDER BY t.nom`,
    [categorie]
  ).map((t) => t.nom);
}

// Tous les types enregistrés, toutes catégories confondues (utilisé pour le filtre)
function getAllTypes() {
  return queryAll("SELECT DISTINCT nom FROM types ORDER BY nom").map((t) => t.nom);
}

// ==== Textiles d'un article ====

function getArticleTextiles(articleId) {
  return queryAll(
    "SELECT textile, pourcentage FROM article_textiles WHERE article_id = ? ORDER BY pourcentage DESC, id",
    [articleId]
  );
}

function setArticleTextiles(articleId, textiles) {
  db.run("DELETE FROM article_textiles WHERE article_id = ?", [articleId]);
  const stmt = db.prepare("INSERT INTO article_textiles (article_id, textile, pourcentage) VALUES (?, ?, ?)");
  (textiles || []).forEach((t) => {
    if (!t.textile) return;
    stmt.run([articleId, t.textile, t.pourcentage || 0]);
  });
  stmt.free();
}

// Enregistre le type pour la catégorie s'il n'existe pas encore (insensible à la casse)
function ensureType(nom, categorie) {
  if (!nom) return;
  db.run(
    "INSERT OR IGNORE INTO types (nom, categorie_id) SELECT ?, id FROM categories WHERE nom = ?",
    [nom, categorie]
  );
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
    sql += ` AND (
      nom LIKE ? OR type LIKE ?
      OR EXISTS (SELECT 1 FROM article_textiles at WHERE at.article_id = articles.id AND at.textile LIKE ?)
    )`;
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  sql += " ORDER BY ajoute_le DESC, id DESC";

  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows.map((row) => ({ ...row, textiles: getArticleTextiles(row.id) }));
}

function getArticle(id) {
  const stmt = db.prepare("SELECT * FROM articles WHERE id = ?");
  stmt.bind([id]);
  let row = null;
  if (stmt.step()) row = stmt.getAsObject();
  stmt.free();
  if (row) row.textiles = getArticleTextiles(id);
  return row;
}

function insertArticle(data) {
  const stmt = db.prepare(`
    INSERT INTO articles (nom, categorie, type, image, symbole_lavage, symbole_blanchiment, symbole_sechage, symbole_repassage, symbole_pressing)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run([
    data.nom,
    data.categorie,
    data.type || null,
    data.image || null,
    data.symbole_lavage || null,
    data.symbole_blanchiment || null,
    data.symbole_sechage || null,
    data.symbole_repassage || null,
    data.symbole_pressing || null,
  ]);
  stmt.free();
  const id = db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0];
  setArticleTextiles(id, data.textiles);
  ensureType(data.type, data.categorie);
  persist();
}

function updateArticle(id, data) {
  const stmt = db.prepare(`
    UPDATE articles SET
      nom = ?, categorie = ?, type = ?, image = ?,
      symbole_lavage = ?, symbole_blanchiment = ?, symbole_sechage = ?, symbole_repassage = ?, symbole_pressing = ?
    WHERE id = ?
  `);
  stmt.run([
    data.nom,
    data.categorie,
    data.type || null,
    data.image || null,
    data.symbole_lavage || null,
    data.symbole_blanchiment || null,
    data.symbole_sechage || null,
    data.symbole_repassage || null,
    data.symbole_pressing || null,
    id,
  ]);
  stmt.free();
  setArticleTextiles(id, data.textiles);
  ensureType(data.type, data.categorie);
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
  db.run(SCHEMA_SQL);
  migrateSchema();
  persist();
}

async function initDatabase() {
  const result = await manager.init(SQL_WASM_BASE64, SCHEMA_SQL);
  db = result.db;
  migrateSchema();
  await initDiskSync();
  persist();
  return db;
}
