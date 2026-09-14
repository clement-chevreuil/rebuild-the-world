#!/bin/bash
# Télécharge tous les symboles d'entretien textile (SVG) depuis Wikimedia Commons
# et les regroupe avec la doc dans un zip.
# Aucune dépendance à Python.
#
# Usage : chmod +x telecharger-symboles.sh && ./telecharger-symboles.sh

set -e

DEST="symboles-entretien-textile"
mkdir -p "$DEST/svg"

BASE="https://commons.wikimedia.org/wiki/Special:FilePath"

# format : "nom_du_fichier_local|chemin_url_encode"
ENTRIES=(
  "Waschen.svg|Waschen.svg"
  "Laundry-symbol-wash-95-b.svg|Laundry%20symbol%20wash%2095.svg"
  "Laundry-symbol-wash-95.svg|Laundry-symbol-wash-95.svg"
  "Laundry-symbol-wash-30-delicate.svg|Laundry%20symbol%20wash%2030%20delicate.svg"
  "Handwaesche.svg|Handw%C3%A4sche.svg"
  "Laundry-symbol-hand-wash.svg|Laundry%20symbol%20hand%20wash.svg"
  "Nicht-waschen.svg|Nicht%20waschen.svg"
  "Laundry-symbol-do-not-wash.svg|Laundry%20symbol%20do%20not%20wash.svg"
  "Bleichen.svg|Bleichen.svg"
  "Bleichen-mit-chlor.svg|Bleichen%20mit%20chlor.svg"
  "Chloren-nein.svg|Chloren%20nein.svg"
  "Nicht-bleichen.svg|Nicht%20bleichen.svg"
  "Trommeltrocknen.svg|Trommeltrocknen.svg"
  "Trommeltrocknen-1.svg|Trommeltrocknen%201.svg"
  "Trommeltrocknen-2.svg|Trommeltrocknen%202.svg"
  "Nicht-trommeltrocknen.svg|Nicht%20trommeltrocknen.svg"
  "Trocknen-leine-im-schatten.svg|Trocknen%20%28leine%20im%20schatten%29.svg"
  "Laundry-symbol-dry-cold.svg|Laundry%20symbol%20dry%20cold.svg"
  "Buegeln.svg|B%C3%BCgeln.svg"
  "Buegeln-1.svg|B%C3%BCgeln%201.svg"
  "Buegeln-2.svg|B%C3%BCgeln%202.svg"
  "Buegeln-3.svg|B%C3%BCgeln%203.svg"
  "Nicht-buegeln.svg|Nicht%20b%C3%BCgeln.svg"
  "Ironing-with-moisture-ISO-7000.svg|Ironing%20with%20moisture%20%28ISO%207000%29.svg"
  "Ironing-without-steam-ISO-7000.svg|Ironing%20without%20steam%20%28ISO%207000%29.svg"
  "Chem-A.svg|Chem%20A.svg"
  "Chem-P.svg|Chem%20P.svg"
  "Chem-F-kilo1.svg|Chem%20F%20kilo1.svg"
  "Chem-nein.svg|Chem%20nein.svg"
)

echo "Téléchargement de ${#ENTRIES[@]} fichiers SVG..."

for entry in "${ENTRIES[@]}"; do
  localname="${entry%%|*}"
  urlpath="${entry##*|}"
  out="$DEST/svg/$localname"
  echo "  -> $localname"
  curl -sL "$BASE/$urlpath" -o "$out" || echo "     échec pour $localname"
done

# copie la doc markdown à côté (doit être dans le même dossier que ce script)
if [ -f "symboles-entretien-textile.md" ]; then
  cp "symboles-entretien-textile.md" "$DEST/"
fi

# zip final : essaie zip, sinon PowerShell Compress-Archive (Windows/Git Bash)
if command -v zip >/dev/null 2>&1; then
  zip -r "symboles-entretien-textile.zip" "$DEST" > /dev/null
  echo "Terminé : symboles-entretien-textile.zip"
elif command -v powershell >/dev/null 2>&1; then
  powershell -NoProfile -Command "Compress-Archive -Path '$DEST' -DestinationPath 'symboles-entretien-textile.zip' -Force"
  echo "Terminé (via PowerShell) : symboles-entretien-textile.zip"
elif command -v powershell.exe >/dev/null 2>&1; then
  powershell.exe -NoProfile -Command "Compress-Archive -Path '$DEST' -DestinationPath 'symboles-entretien-textile.zip' -Force"
  echo "Terminé (via PowerShell) : symboles-entretien-textile.zip"
else
  echo "Ni 'zip' ni PowerShell trouvés : le dossier '$DEST' contient les fichiers,"
  echo "zippe-le manuellement (clic droit -> Envoyer vers -> Dossier compressé)."
fi