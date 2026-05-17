export const GRID = 16;
export const TRI_GRID = 7;

export function getCanvasDimensions(shape) {
  if (shape === "square" || shape === "circle") {
    return { width: 800, height: 800 };
  }

  return { width: 1200, height: 700 };
}

export function getClipPath(shape, width, height, clipId) {
  if (shape === "circle") {
    return `
      <clipPath id="${clipId}">
        <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 2 - 8}" />
      </clipPath>
    `;
  }

  return `
    <clipPath id="${clipId}">
      <rect x="0" y="0" width="${width}" height="${height}" />
    </clipPath>
  `;
}

export function getBackgroundShape(shape, width, height, color, editable = false) {
  const attrs = editable
    ? `class="swiss-editable" data-color-target="bgColor" data-label="Canvas Background"`
    : "";

  if (shape === "circle") {
    return `
      <circle
        ${attrs}
        cx="${width / 2}"
        cy="${height / 2}"
        r="${Math.min(width, height) / 2 - 8}"
        fill="${color}"
      />
    `;
  }

  return `
    <rect
      ${attrs}
      width="${width}"
      height="${height}"
      fill="${color}"
    />
  `;
}

export function getBorderShape(shape, width, height, color, thickness, editable = false) {
  if (thickness <= 0) return "";

  const attrs = editable
    ? `class="swiss-editable" data-color-target="borderColor" data-label="Canvas Border"`
    : "";

  if (shape === "circle") {
    return `
      <circle
        ${attrs}
        cx="${width / 2}"
        cy="${height / 2}"
        r="${Math.min(width, height) / 2 - thickness / 2 - 8}"
        fill="none"
        stroke="${color}"
        stroke-width="${thickness}"
        filter="url(#borderGlow)"
      />
    `;
  }

  return `
    <rect
      ${attrs}
      x="${thickness / 2}"
      y="${thickness / 2}"
      width="${width - thickness}"
      height="${height - thickness}"
      fill="none"
      stroke="${color}"
      stroke-width="${thickness}"
      filter="url(#borderGlow)"
    />
  `;
}

export function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, char => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char];
  });
}

export function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export function hashString(str) {
  let hash = 2166136261;

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24);
  }

  return hash >>> 0;
}

export function seededRandom(seed) {
  return function () {
    seed += 0x6d2b79f5;
    let t = seed;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getLetterPixels(text, letterSize) {
  const chars = text.split("");
  const charCount = Math.max(chars.length, 1);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = charCount === 3 ? 78 : charCount === 2 ? 52 : 38;
  canvas.height = 28;

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";

  const autoScale = charCount === 3 ? 0.82 : 1;
  ctx.font = `bold ${26 * letterSize * autoScale}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const spacing = charCount === 3 ? 15 : charCount === 2 ? 5 : 0;
  const totalWidth = spacing * (charCount - 1);

  chars.forEach((char, index) => {
    const x = canvas.width / 2 - totalWidth / 2 + index * spacing;
    ctx.fillText(char, x, canvas.height / 2 + 1);
  });

  return canvasToPixelRows(ctx, canvas.width, canvas.height, 80);
}

export function getTriangleLetterPixels(text, letterSize) {
  const chars = text.split("");
  const charCount = Math.max(chars.length, 1);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = charCount === 3 ? 86 : charCount === 2 ? 62 : 42;
  canvas.height = 34;

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";

  const autoScale = charCount === 3 ? 0.82 : charCount === 2 ? 0.92 : 1;
  ctx.font = `900 ${28 * letterSize * autoScale}px Arial Black, Helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const spacing = charCount === 3 ? 19 : charCount === 2 ? 12 : 0;
  const totalWidth = spacing * (charCount - 1);

  chars.forEach((char, index) => {
    const x = canvas.width / 2 - totalWidth / 2 + index * spacing;
    ctx.fillText(char, x, canvas.height / 2 + 1);
  });

  return canvasToPixelRows(ctx, canvas.width, canvas.height, 70);
}

function canvasToPixelRows(ctx, width, height, threshold) {
  const data = ctx.getImageData(0, 0, width, height).data;
  const rows = [];

  for (let y = 0; y < height; y++) {
    let row = "";

    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      row += data[i] > threshold ? "1" : "0";
    }

    rows.push(row);
  }

  return rows;
}