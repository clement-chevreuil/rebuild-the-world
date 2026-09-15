// ==== Schéma de la base ====

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  categorie TEXT NOT NULL DEFAULT 'Vêtements',
  type TEXT,
  textile TEXT,
  image TEXT,
  symbole_lavage TEXT,
  symbole_blanchiment TEXT,
  symbole_sechage TEXT,
  symbole_repassage TEXT,
  symbole_pressing TEXT,
  ajoute_le TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL UNIQUE COLLATE NOCASE,
  ordre INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL COLLATE NOCASE,
  categorie_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE (nom, categorie_id)
);

INSERT OR IGNORE INTO categories (nom, ordre) VALUES
  ('Vêtements', 1),
  ('Linge de maison', 2),
  ('Autres', 3);

-- Types par défaut : insérés seulement si la table est encore vide
INSERT INTO types (nom, categorie_id)
SELECT t.nom, c.id
FROM (
  SELECT 'Vêtements' AS cat, 'T-shirt' AS nom UNION ALL
  SELECT 'Vêtements', 'Chemise' UNION ALL
  SELECT 'Vêtements', 'Pull' UNION ALL
  SELECT 'Vêtements', 'Sweat' UNION ALL
  SELECT 'Vêtements', 'Pantalon' UNION ALL
  SELECT 'Vêtements', 'Jean' UNION ALL
  SELECT 'Vêtements', 'Short' UNION ALL
  SELECT 'Vêtements', 'Robe' UNION ALL
  SELECT 'Vêtements', 'Jupe' UNION ALL
  SELECT 'Vêtements', 'Veste' UNION ALL
  SELECT 'Vêtements', 'Manteau' UNION ALL
  SELECT 'Vêtements', 'Caleçon' UNION ALL
  SELECT 'Vêtements', 'Chaussettes' UNION ALL
  SELECT 'Vêtements', 'Pyjama' UNION ALL
  SELECT 'Linge de maison', 'Drap' UNION ALL
  SELECT 'Linge de maison', 'Drap housse' UNION ALL
  SELECT 'Linge de maison', 'Housse de couette' UNION ALL
  SELECT 'Linge de maison', 'Taie d''oreiller' UNION ALL
  SELECT 'Linge de maison', 'Ensemble' UNION ALL
  SELECT 'Linge de maison', 'Couette' UNION ALL
  SELECT 'Linge de maison', 'Plaid' UNION ALL
  SELECT 'Linge de maison', 'Serviette' UNION ALL
  SELECT 'Linge de maison', 'Torchon' UNION ALL
  SELECT 'Linge de maison', 'Nappe' UNION ALL
  SELECT 'Linge de maison', 'Rideau'
) t
JOIN categories c ON c.nom = t.cat
WHERE NOT EXISTS (SELECT 1 FROM types);

-- Rattrape les types déjà saisis sur des articles existants
INSERT OR IGNORE INTO types (nom, categorie_id)
SELECT DISTINCT a.type, c.id
FROM articles a
JOIN categories c ON c.nom = a.categorie
WHERE a.type IS NOT NULL AND TRIM(a.type) <> '';
`;

const EXPORT_FILENAME = "closet.db";

const TEXTILES = ["Coton", "Laine", "Lin", "Soie", "Synthétique / Polyester", "Viscose", "Denim", "Cachemire", "Autre"];

// Un symbole par signification (les doublons graphiques du dossier svg/ sont volontairement omis)
const CARE_LABELS = {
  lavage: "Lavage",
  blanchiment: "Blanchiment",
  sechage: "Séchage",
  repassage: "Repassage",
  pressing: "Nettoyage à sec",
};

const CARE_OPTIONS = {
  lavage: [
    { file: "Waschen.svg", label: "Lavage standard" },
    { file: "Waschen-30.svg", label: "30°" },
    { file: "Waschen-30-delicat.svg", label: "30° délicat" },
    { file: "Waschen-40.svg", label: "40°" },
    { file: "Waschen-40-delicat.svg", label: "40° délicat" },
    { file: "Waschen-50.svg", label: "50°" },
    { file: "Waschen-60.svg", label: "60°" },
    { file: "Waschen-60-delicat.svg", label: "60° délicat" },
    { file: "Waschen-95.svg", label: "95°" },
    { file: "Laundry-symbol-hand-wash.svg", label: "Lavage à la main" },
    { file: "Laundry-symbol-do-not-wash.svg", label: "Ne pas laver" },
  ],
  blanchiment: [
    { file: "Bleichen.svg", label: "Blanchiment autorisé" },
    { file: "Bleichen-mit-chlor.svg", label: "Chlore autorisé" },
    { file: "Chloren-nein.svg", label: "Chlore interdit" },
    { file: "Nicht-bleichen.svg", label: "Ne pas blanchir" },
  ],
  sechage: [
    { file: "Trommeltrocknen.svg", label: "Sèche-linge standard" },
    { file: "Trommeltrocknen-1.svg", label: "Sèche-linge, température réduite" },
    { file: "Trommeltrocknen-2.svg", label: "Sèche-linge, température normale" },
    { file: "Nicht-trommeltrocknen.svg", label: "Pas de sèche-linge" },
    { file: "Trocknen-leine-im-schatten.svg", label: "Séchage à plat / à l'ombre" },
    { file: "Laundry-symbol-dry-cold.svg", label: "Séchage à froid" },
  ],
  repassage: [
    { file: "Buegeln.svg", label: "Repassage standard" },
    { file: "Buegeln-1.svg", label: "• Basse température (110°)" },
    { file: "Buegeln-2.svg", label: "•• Moyenne température (150°)" },
    { file: "Buegeln-3.svg", label: "••• Haute température (200°)" },
    { file: "Nicht-buegeln.svg", label: "Ne pas repasser" },
    { file: "Ironing-with-moisture-ISO-7000.svg", label: "Repassage à la vapeur" },
    { file: "Ironing-without-steam-ISO-7000.svg", label: "Repassage sans vapeur" },
  ],
  pressing: [
    { file: "Chem-A.svg", label: "Tous solvants (A)" },
    { file: "Chem-P.svg", label: "Perchloroéthylène (P)" },
    { file: "Chem-F-kilo1.svg", label: "Solvants pétroliers (F)" },
    { file: "Chem-nein.svg", label: "Ne pas nettoyer à sec" },
  ],
};

const CARE_FIELDS = ["lavage", "blanchiment", "sechage", "repassage", "pressing"];
