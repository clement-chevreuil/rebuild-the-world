// Miroir d'un fichier (ex: export SQLite) vers un vrai dossier sur disque, via la
// File System Access API du navigateur. Le handle du dossier autorisé est mémorisé
// dans IndexedDB pour ne pas redemander la permission à chaque session (Chrome/Edge).
// Aucune dépendance externe — API native uniquement.

const DiskSync = (() => {
  const IDB_NAME = "vendor-disk-sync";
  const STORE = "handles";

  function isSupported() {
    return "showDirectoryPicker" in window;
  }

  function openIdb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbGet(key) {
    const dbi = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = dbi.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbSet(key, value) {
    const dbi = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = dbi.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Ouvre le sélecteur de dossier natif et mémorise le handle sous `storageKey`.
  // Doit être appelé depuis un geste utilisateur (clic).
  async function pickDirectory(storageKey) {
    if (!isSupported()) {
      throw new Error("Ce navigateur ne supporte pas la sauvegarde automatique sur disque (File System Access API).");
    }
    const handle = await window.showDirectoryPicker();
    await idbSet(storageKey, handle);
    return handle;
  }

  // Récupère le dossier déjà autorisé, si la permission est toujours accordée.
  // Retourne null si aucun dossier n'a été choisi ou si la permission doit être redemandée.
  async function getStoredDirectory(storageKey) {
    if (!isSupported()) return null;
    const handle = await idbGet(storageKey);
    if (!handle) return null;

    const granted = await handle.queryPermission({ mode: "readwrite" });
    if (granted === "granted") return handle;
    return null;
  }

  // Redemande explicitement la permission sur un handle déjà mémorisé (nécessite un geste utilisateur).
  async function requestPermission(storageKey) {
    const handle = await idbGet(storageKey);
    if (!handle) return null;
    const result = await handle.requestPermission({ mode: "readwrite" });
    return result === "granted" ? handle : null;
  }

  async function writeFile(dirHandle, filename, bytes) {
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(bytes);
    await writable.close();
  }

  return { isSupported, pickDirectory, getStoredDirectory, requestPermission, writeFile };
})();
