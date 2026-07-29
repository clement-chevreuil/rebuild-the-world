let db = null;
const manager = SQLiteManager.createManager("modeles");

function seedIfEmpty() {
  const res = db.exec("SELECT COUNT(*) FROM modeles");
  const count = res[0].values[0][0];
  if (count === 0) {
    db.run(SEED_SQL);
  }
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
  manager.saveToLocalStorage();
}

function deleteModele(id) {
  db.run("DELETE FROM modeles WHERE id = ?", [id]);
  manager.saveToLocalStorage();
}

function exportDatabase() {
  manager.exportToFile(EXPORT_FILENAME);
}

async function loadDatabaseFromFile(file) {
  await manager.importFromFile(file, (await manager.init(SQL_WASM_BASE64, SCHEMA_SQL, seedIfEmpty)).sqlEngine);
  db = manager.getDatabase();
  seedIfEmpty();
}

async function initDatabase() {
  const result = await manager.init(SQL_WASM_BASE64, SCHEMA_SQL, seedIfEmpty);
  db = result.db;
  return db;
}
