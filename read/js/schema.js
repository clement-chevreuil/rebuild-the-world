// ==== Schéma de la base ====

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL DEFAULT '',
  is_markdown INTEGER NOT NULL DEFAULT 1,
  cree_le TEXT DEFAULT (datetime('now')),
  modifie_le TEXT DEFAULT (datetime('now'))
);
`;

const EXPORT_FILENAME = "read.db";

// Document présent à la première ouverture, tant que la base est vide.
// Écrit ligne par ligne : le contenu contient des backticks Markdown,
// qu'un template literal ne supporterait pas tel quel.
const SEED_DOCUMENT = {
  titre: "Exemple",
  is_markdown: 1,
  contenu: [
    "# Bienvenue",
    "",
    "Ceci est un exemple de document stocké dans la base **SQLite** locale.",
    "",
    "## Fonctionnalités",
    "",
    "- Écrire de nouveaux documents directement dans l'application",
    "- Importer des fichiers `.md` : leur contenu est ajouté à la base",
    "- Exporter la base entière en `.db`, ou un document en `.txt` / `.md` / `.pdf`",
    "",
    "> Tout reste en local : rien ne sort du navigateur.",
    "",
    "Clique sur « Modifier » pour remplacer ce texte par le tien.",
  ].join("\n"),
};
