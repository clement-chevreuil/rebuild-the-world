// ==== Schéma de la base ====

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS aliments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  quantite TEXT,
  type TEXT NOT NULL,
  emplacement TEXT NOT NULL DEFAULT 'Frigo',
  peremption TEXT NOT NULL,
  image TEXT,
  statut TEXT NOT NULL DEFAULT 'actif',
  ajoute_le TEXT DEFAULT (datetime('now')),
  resolu_le TEXT
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  type TEXT,
  achete INTEGER NOT NULL DEFAULT 0,
  ajoute_le TEXT DEFAULT (datetime('now'))
);
`;

// Aucune donnée de test : la table reste vide au premier lancement
const SEED_SQL = ``;

// Nom du fichier proposé au téléchargement lors de l'export
const EXPORT_FILENAME = "food.db";

const CATEGORIES = ["Produits laitiers", "Légumes", "Fruits", "Viande/Poisson", "Épicerie", "Boissons", "Autre"];
const EMPLACEMENTS = ["Frigo", "Congélateur", "Placard"];
