// ==== Schéma de la base ====
// Modifie cette table selon tes besoins : ajoute/retire des colonnes,
// change les types (TEXT, INTEGER, REAL...).

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS modeles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titre TEXT NOT NULL,
  ordre INTEGER,
  cree_le TEXT DEFAULT (datetime('now'))
);
`;

// Données injectées uniquement si la table "modeles" est vide au démarrage
// (donc jamais si tu importes un .db existant qui contient déjà des lignes).
const SEED_SQL = `
INSERT INTO modeles (titre, ordre) VALUES ('test', 1);
`;

// Nom du fichier proposé au téléchargement lors de l'export
const EXPORT_FILENAME = "modeles.db";

// Clé utilisée pour l'auto-sauvegarde dans localStorage (persiste entre les rechargements)
const LOCAL_STORAGE_KEY = "sqlite-app-modeles-db";
