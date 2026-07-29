const SQLiteManager = (() => {
  const createManager = (storageName) => {
    let db = null;
    const LOCAL_STORAGE_KEY = `sqlite_${storageName}`;

    const base64ToUint8Array = (base64) => {
      const binaryStr = atob(base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return bytes;
    };

    const uint8ArrayToBase64 = (bytes) => {
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    const saveToLocalStorage = () => {
      try {
        const bytes = db.export();
        localStorage.setItem(LOCAL_STORAGE_KEY, uint8ArrayToBase64(bytes));
      } catch (err) {
        console.error("Échec de l'auto-sauvegarde localStorage :", err);
      }
    };

    const loadFromLocalStorage = () => {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!saved) return null;
      return base64ToUint8Array(saved);
    };

    const exportToFile = (filename) => {
      const data = db.export();
      const blob = new Blob([data], { type: "application/x-sqlite3" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const importFromFile = async (file, sqlEngine) => {
      const arrayBuffer = await file.arrayBuffer();
      db = new sqlEngine.Database(new Uint8Array(arrayBuffer));
      saveToLocalStorage();
      return db;
    };

    const init = async (wasmBase64, schemaSql, seedFn) => {
      const wasmBinary = base64ToUint8Array(wasmBase64);
      const sqlEngine = await initSqlJs({ wasmBinary });

      const saved = loadFromLocalStorage();

      if (saved) {
        db = new sqlEngine.Database(saved);
        db.run(schemaSql);
      } else {
        db = new sqlEngine.Database();
        db.run(schemaSql);
        if (seedFn) seedFn(db);
        saveToLocalStorage();
      }

      return { db, sqlEngine };
    };

    const getDatabase = () => db;

    return { init, getDatabase, exportToFile, importFromFile, saveToLocalStorage };
  };

  return { createManager };
})();
