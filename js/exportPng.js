import { getCanvasDimensions } from "./svgUtils.js";

export function renderInlinePreview(svgPreview, svgString) {
  svgPreview.innerHTML = svgString;

  const svg = svgPreview.querySelector("svg");

  if (svg) {
    svg.style.width = "100%";
    svg.style.maxHeight = "78vh";
    svg.style.display = "block";
  }
}

export function renderSvgToCanvas(canvas, svgString, shape) {
  const { width, height } = getCanvasDimensions(shape);

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  const img = new Image();

  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8"
  });

  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
  };

  img.src = url;
}

export function downloadCanvasAsPng(canvas, filename = "glyph-pfp-maker.png") {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}