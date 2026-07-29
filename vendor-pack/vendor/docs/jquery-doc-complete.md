# Documentation complète jQuery (hors-ligne)

Version couverte : 4.0.0 — `vendor/jquery/jquery.min.js`

```html
<script src="vendor/jquery/jquery.min.js"></script>
```

`$` et `jQuery` sont deux noms pour la même chose.

---

## 1. Sélecteurs

jQuery accepte tous les sélecteurs CSS standards, plus quelques extensions.

```js
$("*")                    // tout
$("#id")                  // par id
$(".classe")               // par classe
$("div")                   // par balise
$("div.classe")            // balise + classe
$("div, p")                 // plusieurs sélecteurs
$("ul > li")                // enfant direct
$("ul li")                  // descendant
$("li:first")                // premier élément
$("li:last")                 // dernier élément
$("li:eq(2)")                 // élément à l'index 2 (0-indexé)
$("li:even")                  // index pairs
$("li:odd")                   // index impairs
$("input:checked")             // cases cochées
$("input:disabled")            // champs désactivés
$("[data-id]")                  // possède l'attribut
$("[data-id='5']")              // attribut = valeur
$(":contains('texte')")         // contient ce texte
$("p:visible")                  // éléments visibles
$("p:hidden")                   // éléments cachés
```

Sélectionner un élément DOM déjà en main :

```js
const el = document.getElementById("x");
$(el)  // enveloppe un élément natif dans jQuery
```

---

## 2. Parcours du DOM (traversal)

```js
$("#el").parent()           // parent direct
$("#el").parents()          // tous les ancêtres
$("#el").parents(".x")      // ancêtres filtrés
$("#el").closest(".x")      // ancêtre le plus proche qui correspond (ou lui-même)
$("#el").children()         // enfants directs
$("#el").children(".x")     // enfants directs filtrés
$("#el").find(".x")         // tous les descendants correspondants
$("#el").siblings()         // frères et sœurs
$("#el").next()             // élément frère suivant
$("#el").prev()             // élément frère précédent
$("#el").first()            // premier élément de la collection
$("#el").last()             // dernier élément de la collection
$("#el").eq(2)              // élément à l'index 2
$("#el").filter(".x")       // filtre la collection courante
$("#el").not(".x")          // exclut de la collection courante
$("#el").is(".x")           // teste une condition -> true/false
```

---

## 3. Manipulation du contenu

```js
$("#el").text()             // lire le texte (sans HTML)
$("#el").text("nouveau")     // écrire le texte (échappé automatiquement)
$("#el").html()               // lire le HTML interne
$("#el").html("<b>x</b>")     // écrire du HTML (NON échappé — attention aux injections)
$("#el").val()                 // lire la valeur d'un champ de formulaire
$("#el").val("x")               // écrire la valeur

$("#el").append("<p>a</p>")      // ajoute à la fin, à l'intérieur
$("#el").prepend("<p>a</p>")      // ajoute au début, à l'intérieur
$("#el").before("<p>a</p>")        // insère avant l'élément (à l'extérieur)
$("#el").after("<p>a</p>")          // insère après l'élément (à l'extérieur)
$("#el").appendTo("#autre")           // déplace/ajoute #el à la fin de #autre
$("#el").prependTo("#autre")          // idem au début
$("#el").remove()                      // supprime l'élément (et ses données/événements)
$("#el").detach()                       // retire du DOM mais garde données/événements (réinsérable)
$("#el").empty()                         // vide le contenu, garde l'élément
$("#el").clone()                          // copie l'élément (sans les événements par défaut)
$("#el").clone(true)                       // copie avec les événements attachés
$("#el").replaceWith("<p>x</p>")             // remplace l'élément
$("#el").wrap("<div class='x'></div>")        // entoure chaque élément d'un conteneur
```

---

## 4. Attributs, propriétés, classes CSS

```js
$("#el").attr("href")              // lire un attribut
$("#el").attr("href", "x")          // écrire un attribut
$("#el").attr({ href: "x", title: "y" }) // écrire plusieurs attributs
$("#el").removeAttr("href")          // supprimer un attribut

$("#el").prop("checked")               // lire une propriété DOM (booléens surtout : checked, disabled)
$("#el").prop("checked", true)          // écrire une propriété

$("#el").addClass("x")                   // ajouter une classe
$("#el").addClass("x y z")                // plusieurs classes
$("#el").removeClass("x")                  // retirer une classe
$("#el").toggleClass("x")                   // ajoute si absente, retire si présente
$("#el").toggleClass("x", condition)          // force selon une condition booléenne
$("#el").hasClass("x")                          // true/false

$("#el").css("color")                             // lire une propriété CSS calculée
$("#el").css("color", "red")                        // écrire une propriété CSS
$("#el").css({ color: "red", fontSize: "14px" })      // écrire plusieurs propriétés (camelCase)

$("#el").width()      // largeur en px (sans padding/border)
$("#el").height()      // hauteur en px
$("#el").innerWidth()   // largeur + padding
$("#el").outerWidth()    // largeur + padding + border
$("#el").outerWidth(true) // + les marges
```

---

## 5. Événements

```js
$("#el").on("click", fn)                  // attacher un événement
$("#el").on("click", ".enfant", fn)        // délégation (fonctionne pour des enfants ajoutés plus tard)
$("#el").off("click")                        // détacher un événement
$("#el").off("click", fn)                     // détacher un handler précis
$("#el").one("click", fn)                      // ne se déclenche qu'une seule fois
$("#el").trigger("click")                       // déclencher l'événement manuellement

$("#el").click(fn)          // raccourcis équivalents à .on("click", fn)
$("#el").submit(fn)
$("#el").change(fn)
$("#el").keyup(fn)
$("#el").keydown(fn)
$("#el").focus(fn)
$("#el").blur(fn)
$("#el").hover(fnEnter, fnLeave)   // mouseenter + mouseleave

$(document).ready(fn)      // exécute fn quand le DOM est prêt
$(fn)                        // raccourci équivalent
```

Dans le handler, `this` = l'élément DOM natif ; `$(this)` pour repasser en jQuery. L'objet événement `e` (premier paramètre) a `e.preventDefault()`, `e.stopPropagation()`, `e.target`, `e.which` (touche pressée).

---

## 6. Effets et animations

```js
$("#el").show()               // afficher (instantané)
$("#el").hide()                 // cacher (instantané)
$("#el").show(300)                // afficher avec animation (durée en ms)
$("#el").hide(300)
$("#el").toggle()                   // bascule show/hide
$("#el").fadeIn(300)
$("#el").fadeOut(300)
$("#el").fadeToggle(300)
$("#el").slideDown(300)
$("#el").slideUp(300)
$("#el").slideToggle(300)
$("#el").animate({ opacity: 0.5, left: "50px" }, 400)  // animation CSS personnalisée
$("#el").stop()                      // arrête l'animation en cours
$("#el").delay(500).fadeIn()          // enchaîne avec un délai
```

---

## 7. Parcours d'une collection

```js
$(".item").each(function (index, element) {
  // this === element (DOM natif)
  console.log(index, $(this).text());
});

const textes = $(".item").map(function () {
  return $(this).text();
}).get(); // .get() convertit en vrai tableau JS
```

---

## 8. AJAX

```js
$.ajax({
  url: "api/data",
  method: "GET",
  success: function (data) { console.log(data); },
  error: function (err) { console.error(err); }
});

$.get("api/data", function (data) { ... });
$.post("api/data", { cle: "valeur" }, function (data) { ... });
$.getJSON("api/data", function (data) { ... });
```

**Important pour tes projets `file://`** : toutes ces méthodes reposent sur `XMLHttpRequest`, soumis exactement à la même restriction que `fetch()` — elles ne fonctionnent pas en ouvrant un fichier en local sans serveur. jQuery ne contourne pas cette limite.

---

## 9. Création d'éléments et chaînage

```js
const $ligne = $("<li>", { text: "Élément", class: "item", "data-id": 5 });
$("#liste").append($ligne);

// Le chaînage : chaque méthode qui ne "lit" pas une valeur renvoie l'objet jQuery
$("#el").addClass("x").css("color", "red").fadeIn().on("click", fn);
```

---

## 10. Utilitaires globaux (`$.xxx`, pas liés à une sélection)

```js
$.each([1, 2, 3], function (i, val) { console.log(i, val); });  // boucle générique
$.trim("  texte  ")           // retire les espaces (natif JS : String.trim() suffit aujourd'hui)
$.extend({}, obj1, obj2)       // fusionne des objets (comme Object.assign)
$.isArray(x)                     // (natif JS : Array.isArray(x) suffit aujourd'hui)
$.type(x)                         // type précis d'une valeur
$.parseJSON(str)                   // (natif JS : JSON.parse(str) suffit aujourd'hui)
```

Note : beaucoup de ces utilitaires ont un équivalent natif JavaScript moderne et ne sont plus vraiment nécessaires — jQuery reste surtout utile aujourd'hui pour la manipulation du DOM et les événements de façon concise.

---

## Pièges et bonnes pratiques

- `.html()` insère du HTML sans l'échapper : ne jamais y mettre du texte venant d'un utilisateur sans le nettoyer, sinon risque d'injection.
- Toujours utiliser la délégation d'événement (`$("#parent").on("click", ".enfant", fn)`) pour des éléments ajoutés dynamiquement après le chargement de la page — un `.on("click", fn)` direct sur `.enfant` ne fonctionnera pas pour les éléments créés plus tard.
- `.remove()` vs `.detach()` : utilise `.detach()` si tu comptes réinsérer l'élément plus tard avec ses événements intacts.
- Pas besoin de `$(document).ready()` si ton `<script>` est placé juste avant `</body>` (comme dans nos projets) — le DOM est déjà chargé à ce moment-là.
