const App = (() => {
  const init = () => {
    setupEventListeners();
    updateUIState();
  };

  const setupEventListeners = () => {
    document.getElementById('create-btn').addEventListener('click', handleCreate);
    document.getElementById('clear-btn').addEventListener('click', handleClear);
    document.getElementById('undo-btn').addEventListener('click', handleUndo);
    document.getElementById('redo-btn').addEventListener('click', handleRedo);
    document.getElementById('export-png-btn').addEventListener('click', () => Export.exportToPNG());
    document.getElementById('export-jpg-btn').addEventListener('click', () => Export.exportToJPG());

    document.getElementById('pixel-grid').addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('pixel')) {
        handlePixelHover(e);
      }
      document.getElementById('pixel-grid').addEventListener('mouseover', handlePixelHover);
    });

    document.getElementById('pixel-grid').addEventListener('mouseup', () => {
      document.getElementById('pixel-grid').removeEventListener('mouseover', handlePixelHover);
      saveState();
    });
  };

  const handleCreate = () => {
    const width = parseInt(document.getElementById('width-input').value, 10);
    const height = parseInt(document.getElementById('height-input').value, 10);

    if (width < 1 || height < 1 || isNaN(width) || isNaN(height)) {
      alert('Entrez des valeurs positives');
      return;
    }

    History.clear();
    Canvas.init(width, height);
    saveState();
    updateUIState();
    updateStatus(`Tableau ${width}×${height} créé`);
  };

  const handlePixelHover = (e) => {
    if (e.target.classList.contains('pixel')) {
      const x = parseInt(e.target.dataset.x, 10);
      const y = parseInt(e.target.dataset.y, 10);
      const color = document.getElementById('color-picker').value;
      Canvas.setPixel(x, y, color);
    }
  };

  const handleClear = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer tout le dessin?')) {
      Canvas.clear();
      saveState();
      updateUIState();
      updateStatus('Dessin effacé');
    }
  };

  const handleUndo = () => {
    const state = History.undo();
    if (state) {
      Canvas.setState(state);
      updateUIState();
      updateStatus('Annulé');
    }
  };

  const handleRedo = () => {
    const state = History.redo();
    if (state) {
      Canvas.setState(state);
      updateUIState();
      updateStatus('Refait');
    }
  };

  const saveState = () => {
    if (Canvas.isInitialized()) {
      History.push(Canvas.getState());
    }
  };

  const updateUIState = () => {
    const isInitialized = Canvas.isInitialized();
    document.getElementById('clear-btn').disabled = !isInitialized;
    document.getElementById('undo-btn').disabled = !History.canUndo();
    document.getElementById('redo-btn').disabled = !History.canRedo();
    document.getElementById('export-png-btn').disabled = !isInitialized;
    document.getElementById('export-jpg-btn').disabled = !isInitialized;
  };

  const updateStatus = (msg) => {
    document.getElementById('status-text').textContent = msg;
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
