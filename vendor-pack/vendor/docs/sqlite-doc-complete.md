# Documentation complète sql.js (hors-ligne)

Version couverte : celle embarquée dans `vendor/sqlite/sql-wasm-base64.js` (moteur SQLite compilé en WebAssembly, encodé en base64 pour fonctionner sans aucune requête réseau, y compris en `file://`).

```html
<script src="vendor/sqlite/sql-wasm-base64.js"></script>
<script src="vendor/sqlite/sql-wasm.js"></script>
```

Charge toujours ces deux fichiers **dans cet ordre**, avant ton propre code qui utilise SQLite.

---

## 1. Initialisation (sans réseau)

```js
function base64ToUint8Array(base64) {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  return bytes;
}

const SQL = await initSqlJs({ wasmBinary: base64ToUint8Array(SQL_WASM_BASE64) });
```

`initSqlJs` est fourni par `sql-wasm.js`. `SQL_WASM_BASE64` est la variable définie dans `sql-wasm-base64.js`. Le paramètre `wasmBinary` évite tout `fetch` interne — c'est la clé pour que ça marche en `file://`.

---

## 2. Créer ou ouvrir une base

```js
const db = new SQL.Database();                       // base vide, en mémoire
const db = new SQL.Database(new Uint8Array(bytes));    // ouvre une base existante à partir de bytes
```

`bytes` peut venir d'un fichier `.db` importé (`await file.arrayBuffer()` → `new Uint8Array(...)`) ou d'un base64 décodé comme ci-dessus.

---

## 3. Exécuter des requêtes

### `db.run(sql, params?)` — pour les requêtes sans résultat à lire (CREATE, INSERT, UPDATE, DELETE)

```js
db.run("CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, nom TEXT)");
db.run("INSERT INTO items (nom) VALUES (?)", ["Exemple"]);
db.run("DELETE FROM items WHERE id = ?", [3]);
```

### `db.exec(sql)` — pour lire des résultats (SELECT), retourne un tableau de résultats

```js
const res = db.exec("SELECT id, nom FROM items");
// res = [ { columns: ["id","nom"], values: [[1,"Exemple"], [2,"Autre"]] } ]
// res est un tableau VIDE (pas d'erreur) si la requête ne retourne aucune ligne

if (res.length > 0) {
  const { columns, values } = res[0];
  const lignes = values.map(row => Object.fromEntries(row.map((v, i) => [columns[i], v])));
  // lignes = [ { id: 1, nom: "Exemple" }, { id: 2, nom: "Autre" } ]
}
```

### `db.prepare(sql)` — pour des requêtes préparées réutilisables (plus sûr contre l'injection SQL)

```js
const stmt = db.prepare("INSERT INTO items (nom) VALUES (?)");
stmt.run(["Premier"]);
stmt.run(["Deuxième"]); // réutilisable avec d'autres valeurs
stmt.free(); // libère la mémoire — toujours appeler après usage
```

Lire ligne par ligne avec une requête préparée :

```js
const stmt = db.prepare("SELECT * FROM items WHERE nom LIKE ?");
stmt.bind(["%exemple%"]);
while (stmt.step()) {
  const ligne = stmt.getAsObject(); // { id: 1, nom: "Exemple" }
  console.log(ligne);
}
stmt.free();
```

---

## 4. Compter, agréger

```js
const res = db.exec("SELECT COUNT(*) FROM items");
const total = res[0].values[0][0]; // toujours un tableau de tableaux, même pour un seul résultat
```

---

## 5. Exporter la base en fichier `.db`

```js
const data = db.export(); // Uint8Array représentant le fichier SQLite complet
const blob = new Blob([data], { type: "application/x-sqlite3" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "ma-base.db";
a.click();
URL.revokeObjectURL(url);
```

---

## 6. Sauvegarder/charger via `localStorage` (persistance entre rechargements)

```js
function uint8ArrayToBase64(bytes) {
  let binaryStr = "";
  for (let i = 0; i < bytes.length; i++) binaryStr += String.fromCharCode(bytes[i]);
  return btoa(binaryStr);
}

// Sauvegarde après chaque modification
localStorage.setItem("ma-cle", uint8ArrayToBase64(db.export()));

// Rechargement au démarrage
const saved = localStorage.getItem("ma-cle");
const db = saved
  ? new SQL.Database(base64ToUint8Array(saved))
  : new SQL.Database();
```

Voir le projet "base SQLite locale" pour l'implémentation complète (import/export + auto-sauvegarde combinés).

---

## Pièges et bonnes pratiques

- `db.exec()` retourne un tableau **vide** (pas `null`, pas d'erreur) si aucune ligne ne correspond — toujours vérifier `res.length > 0` avant d'accéder à `res[0]`.
- Toujours utiliser des `?` + un tableau de paramètres plutôt que de concaténer des valeurs dans la requête SQL (protection contre l'injection SQL, même en local).
- `stmt.free()` doit être appelé après chaque `db.prepare()` pour éviter les fuites mémoire, surtout si tu crées beaucoup de requêtes préparées en boucle.
- `db.export()` renvoie un instantané à un instant T — si tu modifies la base après, il faut ré-exporter pour avoir la version à jour.
- Une base créée avec `new SQL.Database()` (sans argument) est **entièrement en mémoire RAM** — rien n'est écrit sur le disque tant que tu n'exportes pas ou ne sauvegardes pas dans `localStorage`.
