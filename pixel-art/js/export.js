const Export = (() => {
  const exportToPNG = () => {
    const canvas = Canvas.toCanvas();
    const upscaledCanvas = upscaleCanvas(canvas, 10);
    downloadImage(upscaledCanvas, 'pixel-art.png', 'image/png');
  };

  const exportToJPG = () => {
    const canvas = Canvas.toCanvas();
    const upscaledCanvas = upscaleCanvas(canvas, 10);
    downloadImage(upscaledCanvas, 'pixel-art.jpg', 'image/jpeg');
  };

  const upscaleCanvas = (canvas, scale) => {
    const upscaled = document.createElement('canvas');
    upscaled.width = canvas.width * scale;
    upscaled.height = canvas.height * scale;
    const ctx = upscaled.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, 0, upscaled.width, upscaled.height);
    return upscaled;
  };

  const downloadImage = (canvas, filename, mimeType) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }, mimeType);
  };

  return { exportToPNG, exportToJPG };
})();
