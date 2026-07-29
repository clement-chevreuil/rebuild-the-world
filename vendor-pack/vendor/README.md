# Dossier `vendor/` — librairies universelles

À copier une seule fois à la racine de n'importe quel projet HTML/CSS/JS natif.
Aucune de ces librairies n'appelle de CDN — tout est en local, ça marche direct en `file://`.

```
vendor/
├── jquery/
│   └── jquery.min.js              (v4.0.0)
├── bootstrap/
│   ├── bootstrap.min.css          (v5.3.8)
│   └── bootstrap.bundle.min.js    (v5.3.8, inclut Popper)
├── sqlite/
│   ├── sql-wasm.js                (loader sql.js)
│   └── sql-wasm-base64.js         (moteur SQLite en WASM, encodé en base64)
└── docs/
    ├── jquery-doc-complete.md
    ├── bootstrap-doc-complete.md
    └── sqlite-doc-complete.md
```

## Utilisation dans une page

```html
<head>
  <link rel="stylesheet" href="vendor/bootstrap/bootstrap.min.css">
  <link rel="stylesheet" href="style.css"> <!-- ton style perso, après Bootstrap -->
</head>
<body>
  ...

  <script src="vendor/sqlite/sql-wasm-base64.js"></script>
  <script src="vendor/sqlite/sql-wasm.js"></script>
  <script src="vendor/jquery/jquery.min.js"></script>
  <script src="vendor/bootstrap/bootstrap.bundle.min.js"></script>
  <script src="script.js"></script> <!-- ton code perso, après les librairies -->
</body>
```

Charge toujours ton propre CSS **après** `bootstrap.min.css` (pour pouvoir surcharger ses styles), et tes propres scripts **après** jQuery/Bootstrap (pour pouvoir les utiliser).

## Si un projet vit dans des sous-dossiers (ex : `pages/ma-page/`)

Adapte le chemin relatif : `../../vendor/bootstrap/bootstrap.min.css` au lieu de `vendor/bootstrap/bootstrap.min.css`.

## Mise à jour des librairies

Pour changer de version un jour, remplace simplement les fichiers dans `vendor/jquery/` ou `vendor/bootstrap/` — rien d'autre à toucher, les noms de fichiers restent les mêmes.
