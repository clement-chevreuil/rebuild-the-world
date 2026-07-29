# Documentation complète Bootstrap 5 (hors-ligne)

Version couverte : 5.3.8 — `vendor/bootstrap/bootstrap.min.css` + `bootstrap.bundle.min.js`

```html
<link rel="stylesheet" href="vendor/bootstrap/bootstrap.min.css">
<!-- juste avant </body> -->
<script src="vendor/bootstrap/bootstrap.bundle.min.js"></script>
```

Le bundle inclut Popper — nécessaire aux dropdowns, tooltips, popovers. Aucun composant JS ne fait de requête réseau : tout fonctionne en `file://`.

---

## 1. Grille (layout responsive)

```html
<div class="container">        <!-- ou "container-fluid" pour pleine largeur -->
  <div class="row">
    <div class="col-md-8">Contenu principal</div>
    <div class="col-md-4">Barre latérale</div>
  </div>
</div>
```

- 12 colonnes au total par `row`. `col-md-8` + `col-md-4` = 12 (pleine largeur)
- Breakpoints, du plus petit au plus grand : `col-`, `col-sm-`, `col-md-`, `col-lg-`, `col-xl-`, `col-xxl-`
- `col` seul (sans nombre) = largeur automatique, répartie équitablement
- `col-auto` = largeur du contenu, ne s'étire pas
- `offset-md-2` = décale la colonne de 2 unités vers la droite
- `order-1`, `order-2`... = réordonne visuellement sans changer le HTML
- `g-3` sur `row` = ajoute un espacement (gouttière) entre les colonnes

---

## 2. Typographie

```html
<h1>Titre 1</h1> ... <h6>Titre 6</h6>
<p class="lead">Texte d'intro plus visible.</p>
<small>Texte plus petit</small>
<mark>Texte surligné</mark>
<blockquote class="blockquote">Citation</blockquote>

<p class="text-muted">Gris atténué</p>
<p class="text-center">Centré</p>
<p class="text-truncate">Coupe avec ... si trop long (nécessite un conteneur de largeur fixe)</p>
<p class="fw-bold">Gras</p>
<p class="fw-normal">Normal</p>
<p class="fst-italic">Italique</p>
<p class="text-decoration-underline">Souligné</p>
<p class="text-uppercase">MAJUSCULES forcées</p>
```

---

## 3. Couleurs

Classes de fond : `bg-primary`, `bg-secondary`, `bg-success`, `bg-danger`, `bg-warning`, `bg-info`, `bg-light`, `bg-dark`, `bg-white`, `bg-transparent`
Classes de texte : `text-primary`, `text-secondary`, `text-success`, `text-danger`, `text-warning`, `text-info`, `text-light`, `text-dark`, `text-white`, `text-body`, `text-muted`

Ajoute `bg-opacity-25/50/75` pour une transparence partielle sur le fond.

---

## 4. Boutons

```html
<button class="btn btn-primary">Primaire</button>
<button class="btn btn-secondary">Secondaire</button>
<button class="btn btn-success">Succès</button>
<button class="btn btn-danger">Danger</button>
<button class="btn btn-warning">Attention</button>
<button class="btn btn-info">Info</button>
<button class="btn btn-light">Clair</button>
<button class="btn btn-dark">Sombre</button>
<button class="btn btn-link">Lien</button>

<button class="btn btn-outline-primary">Contour seulement</button>

<button class="btn btn-primary btn-sm">Petit</button>
<button class="btn btn-primary btn-lg">Grand</button>

<button class="btn btn-primary" disabled>Désactivé</button>

<div class="btn-group">
  <button class="btn btn-primary">A</button>
  <button class="btn btn-primary">B</button>
</div>
```

---

## 5. Formulaires

```html
<div class="mb-3">
  <label class="form-label" for="titre">Titre</label>
  <input type="text" class="form-control" id="titre" placeholder="...">
  <div class="form-text">Texte d'aide sous le champ.</div>
</div>

<div class="mb-3">
  <label class="form-label">Catégorie</label>
  <select class="form-select">
    <option>Option 1</option>
  </select>
</div>

<div class="form-check">
  <input class="form-check-input" type="checkbox" id="c1">
  <label class="form-check-label" for="c1">Case à cocher</label>
</div>

<div class="form-check form-switch">
  <input class="form-check-input" type="checkbox" id="s1">
  <label class="form-check-label" for="s1">Interrupteur (switch)</label>
</div>

<!-- Validation visuelle -->
<input class="form-control is-valid">
<input class="form-control is-invalid">
<div class="invalid-feedback">Message d'erreur affiché sous le champ invalide.</div>

<!-- Champ + bouton groupés -->
<div class="input-group">
  <span class="input-group-text">@</span>
  <input type="text" class="form-control">
</div>
```

---

## 6. Alertes

```html
<div class="alert alert-success">Succès</div>
<div class="alert alert-danger">Erreur</div>
<div class="alert alert-warning">Attention</div>
<div class="alert alert-info">Info</div>

<div class="alert alert-warning alert-dismissible fade show">
  Message avec bouton de fermeture.
  <button class="btn-close" data-bs-dismiss="alert"></button>
</div>
```

---

## 7. Cartes (cards)

```html
<div class="card" style="width: 18rem;">
  <img src="..." class="card-img-top">
  <div class="card-body">
    <h5 class="card-title">Titre</h5>
    <h6 class="card-subtitle text-muted">Sous-titre</h6>
    <p class="card-text">Contenu.</p>
    <a href="#" class="btn btn-primary">Action</a>
  </div>
  <div class="card-footer text-muted">Pied de carte</div>
</div>
```

---

## 8. Navbar

```html
<nav class="navbar navbar-expand-lg navbar-light bg-light">
  <div class="container-fluid">
    <a class="navbar-brand" href="#">Mon site</a>
    <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#nav1">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="nav1">
      <ul class="navbar-nav">
        <li class="nav-item"><a class="nav-link active" href="#">Accueil</a></li>
        <li class="nav-item"><a class="nav-link" href="#">Autre page</a></li>
      </ul>
    </div>
  </div>
</nav>
```

`navbar-expand-lg` = replié en menu burger sous la taille "lg", déplié au-dessus.

---

## 9. Onglets (nav-tabs) et Pills

```html
<ul class="nav nav-tabs">
  <li class="nav-item">
    <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#onglet1">Onglet 1</button>
  </li>
  <li class="nav-item">
    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#onglet2">Onglet 2</button>
  </li>
</ul>
<div class="tab-content">
  <div class="tab-pane fade show active" id="onglet1">Contenu 1</div>
  <div class="tab-pane fade" id="onglet2">Contenu 2</div>
</div>
```

`nav-pills` au lieu de `nav-tabs` = même logique, style "pilules" arrondies.

---

## 10. Modale

```html
<button data-bs-toggle="modal" data-bs-target="#monModal">Ouvrir</button>

<div class="modal fade" id="monModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Titre</h5>
        <button class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">Contenu de la modale.</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
        <button class="btn btn-primary">Valider</button>
      </div>
    </div>
  </div>
</div>
```

Ouvrir/fermer en JS : `new bootstrap.Modal(document.getElementById('monModal')).show()` / `.hide()`.

---

## 11. Offcanvas (panneau latéral coulissant)

```html
<button data-bs-toggle="offcanvas" data-bs-target="#panneau">Ouvrir</button>

<div class="offcanvas offcanvas-start" id="panneau">
  <div class="offcanvas-header">
    <h5>Titre</h5>
    <button class="btn-close" data-bs-dismiss="offcanvas"></button>
  </div>
  <div class="offcanvas-body">Contenu du panneau.</div>
</div>
```

`offcanvas-start/end/top/bottom` = côté d'apparition.

---

## 12. Toasts (notifications discrètes)

```html
<div class="toast" role="alert">
  <div class="toast-header">
    <strong class="me-auto">Titre</strong>
    <button class="btn-close" data-bs-dismiss="toast"></button>
  </div>
  <div class="toast-body">Message.</div>
</div>
```

En JS : `new bootstrap.Toast(el).show()` — les toasts ne s'affichent pas tout seuls, il faut les déclencher en JS.

---

## 13. Tooltips et Popovers

```html
<button data-bs-toggle="tooltip" title="Info au survol">Survole-moi</button>
<button data-bs-toggle="popover" data-bs-title="Titre" data-bs-content="Contenu">Clique-moi</button>
```

**Important** : contrairement aux modales/dropdowns, les tooltips et popovers doivent être **activés explicitement en JS** :

```js
document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => new bootstrap.Tooltip(el));
document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => new bootstrap.Popover(el));
```

---

## 14. Dropdown

```html
<div class="dropdown">
  <button class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">Menu</button>
  <ul class="dropdown-menu">
    <li><a class="dropdown-item" href="#">Action 1</a></li>
    <li><a class="dropdown-item" href="#">Action 2</a></li>
    <li><hr class="dropdown-divider"></li>
    <li><a class="dropdown-item" href="#">Action 3</a></li>
  </ul>
</div>
```

---

## 15. Collapse (contenu repliable)

```html
<button data-bs-toggle="collapse" data-bs-target="#zone">Afficher/masquer</button>
<div class="collapse" id="zone">Contenu repliable.</div>
```

---

## 16. Accordion

```html
<div class="accordion" id="acc1">
  <div class="accordion-item">
    <h2 class="accordion-header">
      <button class="accordion-button" data-bs-toggle="collapse" data-bs-target="#item1">
        Section 1
      </button>
    </h2>
    <div class="accordion-collapse collapse show" id="item1" data-bs-parent="#acc1">
      <div class="accordion-body">Contenu de la section 1.</div>
    </div>
  </div>
</div>
```

`data-bs-parent="#acc1"` = un seul panneau ouvert à la fois dans cet accordéon (retire l'attribut pour permettre plusieurs panneaux ouverts simultanément).

---

## 17. Carousel (diaporama)

```html
<div id="carousel1" class="carousel slide">
  <div class="carousel-inner">
    <div class="carousel-item active"><img src="1.jpg" class="d-block w-100"></div>
    <div class="carousel-item"><img src="2.jpg" class="d-block w-100"></div>
  </div>
  <button class="carousel-control-prev" data-bs-target="#carousel1" data-bs-slide="prev">
    <span class="carousel-control-prev-icon"></span>
  </button>
  <button class="carousel-control-next" data-bs-target="#carousel1" data-bs-slide="next">
    <span class="carousel-control-next-icon"></span>
  </button>
</div>
```

---

## 18. Liste, tableau, badges, progression, spinners, pagination

```html
<ul class="list-group">
  <li class="list-group-item">Item 1</li>
  <li class="list-group-item active">Item sélectionné</li>
</ul>

<table class="table table-striped table-hover table-bordered">
  <thead><tr><th>Colonne</th></tr></thead>
  <tbody><tr><td>Valeur</td></tr></tbody>
</table>

<span class="badge bg-primary">Nouveau</span>

<div class="progress">
  <div class="progress-bar" style="width: 60%">60%</div>
</div>

<div class="spinner-border text-primary"></div>
<div class="spinner-grow text-primary"></div>

<nav>
  <ul class="pagination">
    <li class="page-item"><a class="page-link" href="#">1</a></li>
    <li class="page-item active"><a class="page-link" href="#">2</a></li>
  </ul>
</nav>

<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item"><a href="#">Accueil</a></li>
    <li class="breadcrumb-item active">Page actuelle</li>
  </ol>
</nav>
```

---

## 19. Utilitaires (classes à combiner librement)

### Espacement
`m` = margin, `p` = padding. Directions : `t` (top), `b` (bottom), `s` (start/gauche), `e` (end/droite), `x` (horizontal), `y` (vertical), rien = les 4 côtés.
Échelle : `0` à `5` (croissant), ou `auto`.

```
m-3   mt-2   mb-4   mx-auto   p-3   px-4   py-2
```

### Affichage
```
d-none      d-block      d-inline      d-inline-block
d-flex      d-grid       d-md-none (responsive : caché seulement à partir de "md")
```

### Flexbox (avec `d-flex`)
```
flex-row       flex-column
justify-content-start/center/end/between/around
align-items-start/center/end/stretch
flex-wrap      flex-nowrap
gap-1 à gap-5
```

### Dimensions
```
w-25  w-50  w-75  w-100  w-auto
h-25  h-50  h-75  h-100  h-auto
mw-100 (max-width 100%)   vh-100 (100% hauteur d'écran)
```

### Position
```
position-static/relative/absolute/fixed/sticky
top-0  bottom-0  start-0  end-0
translate-middle (centrage précis avec position absolute)
```

### Bordures et arrondis
```
border  border-0  border-top  border-primary  border-2 (épaisseur)
rounded  rounded-circle  rounded-pill  rounded-0
```

### Ombres
```
shadow-none  shadow-sm  shadow  shadow-lg
```

### Visibilité et overflow
```
visible  invisible
overflow-auto  overflow-hidden  overflow-scroll
```

### Z-index
```
z-0  z-1  z-2  z-3
```

---

## Pièges et bonnes pratiques

- Les composants interactifs (dropdown, modal, collapse, accordion, offcanvas, carousel) fonctionnent **automatiquement** via les attributs `data-bs-*`, sans JS à écrire — sauf tooltips/popovers/toasts qui nécessitent une activation explicite (voir sections 13 et 12).
- Toujours charger `bootstrap.bundle.min.js` (pas `bootstrap.min.js` seul) si tu veux les dropdowns/tooltips/popovers — la version non-bundle n'inclut pas Popper.
- Charge ton `style.css` perso **après** `bootstrap.min.css` pour pouvoir surcharger ses styles par défaut.
- Bootstrap 5 n'a plus besoin de jQuery (contrairement à Bootstrap 4) — les deux peuvent cohabiter sans conflit si tu utilises aussi jQuery pour autre chose.
