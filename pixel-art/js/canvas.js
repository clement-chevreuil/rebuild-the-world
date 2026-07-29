const Canvas = (() => {
  let grid = null;
  let width = 0;
  let height = 0;
  const pixelSize = 20;

  const init = (w, h) => {
    width = w;
    height = h;
    grid = Array(height).fill(null).map(() => Array(width).fill('#ffffff'));
    render();
  };

  const render = () => {
    const container = document.getElementById('pixel-grid');
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${width}, ${pixelSize}px)`;
    container.style.gridTemplateRows = `repeat(${height}, ${pixelSize}px)`;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixel = document.createElement('div');
        pixel.className = 'pixel';
        pixel.style.backgroundColor = grid[y][x];
        pixel.dataset.x = x;
        pixel.dataset.y = y;
        pixel.addEventListener('click', (e) => {
          handlePixelClick(x, y, e);
        });
        container.appendChild(pixel);
      }
    }
  };

  const handlePixelClick = (x, y, e) => {
    if (e.buttons === 1 || e.type === 'click') {
      const color = document.getElementById('color-picker').value;
      setPixel(x, y, color);
    }
  };

  const setPixel = (x, y, color) => {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      grid[y][x] = color;
      const pixel = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
      if (pixel) pixel.style.backgroundColor = color;
    }
  };

  const getState = () => JSON.parse(JSON.stringify(grid));

  const setState = (newGrid) => {
    grid = JSON.parse(JSON.stringify(newGrid));
    render();
  };

  const clear = () => {
    grid = grid.map(row => row.map(() => '#ffffff'));
    render();
  };

  const toCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        ctx.fillStyle = grid[y][x];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    return canvas;
  };

  const isInitialized = () => grid !== null;

  return { init, render, setPixel, getState, setState, clear, toCanvas, isInitialized, getWidth: () => width, getHeight: () => height };
})();
