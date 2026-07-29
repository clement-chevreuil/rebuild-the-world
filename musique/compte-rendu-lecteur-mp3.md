# Compte rendu — Lecteur MP3 web (idée de secours)

## Contexte

Idée d'un lecteur de musique HTML/CSS/JS natif, pas pour remplacer Samsung Music au quotidien, mais comme solution de secours si un jour plus aucune appli n'est disponible — cohérent avec le manifeste (logiciel autonome qui fonctionne indéfiniment).

## Ajout des morceaux

Pas de lecture automatique de dossier possible (restriction `file://`, comme partout ailleurs dans les autres projets). Solution retenue : un fichier `chansons-manifest.js` édité à la main, une ligne par morceau ajouté.

## Comparaison batterie vs Samsung Music

- Décodage audio lui-même : quasi identique (même circuit matériel dans les deux cas)
- Écart réel : le moteur du navigateur qui reste actif en fond
- Estimation raisonnée sur 1h, écran éteint : **~1 à 2 points de batterie de plus** qu'une appli native — pas de chiffre officiel trouvé, ordre de grandeur seulement
- Écart qui grandirait si écran allumé, animations actives, ou autres onglets ouverts

## Leviers pour réduire l'écart

- Un seul `<audio>` réutilisé, pas un par morceau
- `timeupdate` natif plutôt que `setInterval`
- Zéro animation en boucle pendant la lecture
- Media Session API (contrôle écran verrouillé + évite que le système tue l'onglet)
- Écran éteint pendant l'écoute (le plus gros levier, indépendant du code)

## Statut

Pas encore construit — en attente, prêt à être lancé quand souhaité. Rien d'urgent, discussion à visée exploratoire pour le moment.
