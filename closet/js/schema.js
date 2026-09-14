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
`;

const EXPORT_FILENAME = "closet.db";

const CATEGORIES = ["Vêtements", "Linge de maison"];

const TEXTILES = ["Coton", "Laine", "Lin", "Soie", "Synthétique / Polyester", "Viscose", "Denim", "Cachemire", "Autre"];

const TYPE_SUGGESTIONS = {
  "Vêtements": ["T-shirt", "Chemise", "Pull", "Pantalon", "Jean", "Robe", "Jupe", "Veste", "Manteau", "Sous-vêtement", "Chaussettes"],
  "Linge de maison": ["Drap", "Housse de couette", "Taie d'oreiller", "Serviette", "Torchon", "Nappe", "Rideau"],
};

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
