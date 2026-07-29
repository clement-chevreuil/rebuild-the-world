# Manifeste

## Le but

Faire des petits logiciels **mignons**, légers, qui ne consomment rien — ni ressources, ni temps de maintenance, ni dépendance envers l'extérieur.

## Les règles

**Aucune compilation.** Pas de build, pas de bundler, pas d'étape entre l'écriture du code et son exécution. Un fichier `.html` s'ouvre, un fichier `.html` fonctionne.

**Aucun serveur.** Tout doit tourner en ouvrant directement un fichier HTML (double-clic), y compris sur mobile. Pas de `npm run dev`, pas de processus qui tourne en arrière-plan, pas de port à surveiller.

**Aucune dépendance externe au runtime.** Aucun appel réseau une fois le logiciel en main — pas de CDN, pas d'API tierce, pas de `fetch` vers l'extérieur. Ce que le logiciel utilise, il l'a déjà avec lui.

**Les librairies sont acceptées à une condition.** jQuery, Bootstrap ou toute autre librairie peuvent être utilisées, mais uniquement si elles sont **téléchargées au préalable et intégrées localement** dans le projet — jamais chargées depuis un CDN au moment de l'exécution. La librairie devient partie du logiciel, pas une dépendance envers un service extérieur qui pourrait disparaître, changer, ou nécessiter une connexion.

**HTML/CSS/JS natif par défaut.** Pas de framework qui impose sa propre façon de penser (React, Vue, etc.) sauf besoin réellement justifié. Le langage du navigateur suffit pour la plupart des besoins.

## Pourquoi

Un logiciel qui dépend d'un serveur, d'une compilation ou d'un service externe est un logiciel qui peut casser sans qu'on y touche : une dépendance qui change de version, un service qui ferme, une connexion qui manque. Un logiciel natif, autonome et local ne casse pas tout seul — il continue de fonctionner exactement comme le jour où il a été créé, indéfiniment.

## Ce que ça implique concrètement

- Les données sont stockées en local (`localStorage`, fichiers `.db` exportés/importés) plutôt que sur un serveur distant
- Les fonctionnalités qui semblent nécessiter un serveur (écriture automatique de fichiers, accès disque arbitraire) sont soit contournées différemment (export/import manuel), soit acceptées comme limite assumée plutôt que comme un problème à résoudre à tout prix
- Chaque projet reste consultable et modifiable des années plus tard, sans avoir à réinstaller un environnement de développement ou des dépendances qui auront évolué entre-temps
