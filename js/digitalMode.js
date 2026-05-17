import {
  GRID,
  TRI_GRID,
  getCanvasDimensions,
  getClipPath,
  getBackgroundShape,
  getBorderShape,
  getLetterPixels,
  getTriangleLetterPixels,
  hashString,
  seededRandom
} from "./svgUtils.js";

export function renderDigitalMode(state) {
  const { width, height } = getCanvasDimensions(state.shape);
  const rand = seededRandom(createDigitalSeed(state));
  const clipId = "artClip";

  const svg = [];

  svg.push(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        ${getClipPath(state.shape, width, height, clipId)}

        <filter id="symbolGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.9" flood-color="${state.color}" flood-opacity="1"/>
        </filter>

        <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.2" flood-color="${state.color}" flood-opacity="0.55"/>
        </filter>

        <filter id="triGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feDropShadow dx="0" dy="0" stdDeviation="0.75" flood-color="${state.color}" flood-opacity="0.9"/>
        </filter>

        <filter id="borderGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.4" flood-color="${state.borderColor}" flood-opacity="0.9"/>
        </filter>
      </defs>

      ${getBackgroundShape(state.shape, width, height, state.bgColor)}

      <g clip-path="url(#${clipId})">
  `);

  if (state.digitalPattern === "triangles") {
    renderTriangleGlyph(svg, state, width, height, rand);
  } else {
    renderShapeGlyph(svg, state, width, height, rand);
  }

  svg.push(`
      </g>
      ${getBorderShape(state.shape, width, height, state.borderColor, state.borderThickness)}
    </svg>
  `);

  return svg.join("");
}

function createDigitalSeed(state) {
  return hashString(
    state.text +
      state.shape +
      state.intensity +
      state.bgIntensity +
      state.messiness +
      state.color +
      state.bgColor +
      state.borderColor +
      state.borderThickness +
      state.letterSize +
      state.digitalPattern
  );
}

/* -----------------------------
   Shape glyph renderer
-------------------------------- */

function renderShapeGlyph(svg, state, width, height, rand) {
  drawAmbientSymbols(svg, state.bgIntensity, rand, width, height, state.color);

  const letterMap = getLetterPixels(state.text, state.letterSize);
  const occupied = getOccupiedCells(letterMap, width, height);

  drawSoftLetterMass(svg, occupied, state.color);
  drawSymbolLetterBody(svg, occupied, state.intensity, state.messiness, rand, state.color);
  drawSymbolLetterEdges(svg, occupied, state.messiness, rand, width, height, state.color);
}

function getOccupiedCells(letterMap, width, height) {
  const macro = 2;
  const letterCols = letterMap[0].length * macro;
  const letterRows = letterMap.length * macro;

  const startX = Math.floor((width / GRID - letterCols) / 2);
  const startY = Math.floor((height / GRID - letterRows) / 2);

  const occupied = new Set();

  for (let y = 0; y < letterMap.length; y++) {
    for (let x = 0; x < letterMap[y].length; x++) {
      if (letterMap[y][x] !== "1") continue;

      for (let yy = 0; yy < macro; yy++) {
        for (let xx = 0; xx < macro; xx++) {
          occupied.add(`${startX + x * macro + xx},${startY + y * macro + yy}`);
        }
      }
    }
  }

  return occupied;
}

function drawAmbientSymbols(svg, bgIntensity, rand, width, height, color) {
  const cols = Math.floor(width / GRID);
  const rows = Math.floor(height / GRID);
  const count = 70 + bgIntensity * 5;

  svg.push(`
    <g fill="${color}" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.36">
  `);

  for (let i = 0; i < count; i++) {
    const gx = Math.floor(rand() * cols);
    const gy = Math.floor(rand() * rows);
    const px = gx * GRID + GRID / 2;
    const py = gy * GRID + GRID / 2;

    const centerX = width / 2;
    const centerY = height / 2;
    const dist = Math.hypot(px - centerX, py - centerY);
    const maxDist = Math.hypot(centerX, centerY);
    const edgeBias = dist / maxDist;

    if (rand() > 0.35 + edgeBias) continue;

    svg.push(`<g opacity="${rand() * 0.22 + 0.08}">`);

    if (rand() < 0.8) {
      drawLightSymbol(svg, px, py, rand, 0.7);
    } else {
      drawMediumSymbol(svg, px, py, rand);
    }

    svg.push(`</g>`);
  }

  svg.push(`</g>`);
}

function drawSoftLetterMass(svg, occupied, color) {
  svg.push(`<g opacity="0.24" fill="${color}" stroke="none" filter="url(#softGlow)">`);

  occupied.forEach(key => {
    const [gx, gy] = key.split(",").map(Number);
    const x = gx * GRID + GRID / 2;
    const y = gy * GRID + GRID / 2;

    svg.push(`
      <rect 
        x="${x - GRID * 0.32}" 
        y="${y - GRID * 0.32}" 
        width="${GRID * 0.64}" 
        height="${GRID * 0.64}" 
      />
    `);
  });

  svg.push(`</g>`);
}

function drawSymbolLetterBody(svg, occupied, intensity, messiness, rand, color) {
  const heavyChance = 0.54 + intensity / 180;
  const mediumChance = 0.28;
  const skipChance = messiness / 900;

  svg.push(`
    <g fill="${color}" stroke="${color}" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round" filter="url(#symbolGlow)">
  `);

  occupied.forEach(key => {
    if (rand() < skipChance) return;

    const [gx, gy] = key.split(",").map(Number);
    const px = gx * GRID + GRID / 2;
    const py = gy * GRID + GRID / 2;

    const neighborCount = countNeighbors(gx, gy, occupied);
    const edgeCell = neighborCount < 5;

    let roll = rand();

    if (!edgeCell) roll -= 0.18;

    if (roll < heavyChance) {
      drawHeavySymbol(svg, px, py, rand);
    } else if (roll < heavyChance + mediumChance) {
      drawMediumSymbol(svg, px, py, rand);
    } else {
      drawLightSymbol(svg, px, py, rand, 0.8);
    }
  });

  svg.push(`</g>`);
}

function drawSymbolLetterEdges(svg, occupied, messiness, rand, width, height, color) {
  const edgeCells = [];

  occupied.forEach(key => {
    const [gx, gy] = key.split(",").map(Number);
    if (countNeighbors(gx, gy, occupied) < 5) {
      edgeCells.push([gx, gy]);
    }
  });

  const amount = Math.floor(edgeCells.length * (messiness / 100) * 0.75);

  svg.push(`
    <g fill="${color}" stroke="${color}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" opacity="0.62" filter="url(#symbolGlow)">
  `);

  for (let i = 0; i < amount; i++) {
    const [gx, gy] = edgeCells[Math.floor(rand() * edgeCells.length)];

    const offsets = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1]
    ];

    const [ox, oy] = offsets[Math.floor(rand() * offsets.length)];
    const nx = gx + ox;
    const ny = gy + oy;

    if (occupied.has(`${nx},${ny}`)) continue;
    if (!insideBounds(nx, ny, width, height)) continue;

    const px = nx * GRID + GRID / 2;
    const py = ny * GRID + GRID / 2;

    if (rand() < 0.7) {
      drawLightSymbol(svg, px, py, rand, 1);
    } else {
      drawMediumSymbol(svg, px, py, rand);
    }
  }

  svg.push(`</g>`);
}

function drawHeavySymbol(svg, x, y, rand) {
  const s = GRID * 0.74;

  const choices = [
    () => svg.push(`<circle cx="${x}" cy="${y}" r="${s / 2}" fill="none"/>`),

    () =>
      svg.push(`
        <polygon 
          points="${x - s * 0.46},${y - s * 0.24} ${x},${y - s * 0.52} ${x + s * 0.46},${y - s * 0.24} ${x + s * 0.46},${y + s * 0.24} ${x},${y + s * 0.52} ${x - s * 0.46},${y + s * 0.24}" 
          fill="none"
        />
      `),

    () =>
      svg.push(`
        <polygon 
          points="${x},${y - s / 2} ${x + s / 2},${y} ${x},${y + s / 2} ${x - s / 2},${y}" 
          fill="none"
        />
      `),

    () => {
      const b = s * 0.25;
      const gap = s * 0.11;

      svg.push(`
        <rect x="${x - b - gap}" y="${y - b - gap}" width="${b}" height="${b}" stroke="none"/>
        <rect x="${x + gap}" y="${y - b - gap}" width="${b}" height="${b}" stroke="none"/>
        <rect x="${x - b - gap}" y="${y + gap}" width="${b}" height="${b}" stroke="none"/>
        <rect x="${x + gap}" y="${y + gap}" width="${b}" height="${b}" stroke="none"/>
      `);
    }
  ];

  choices[Math.floor(rand() * choices.length)]();
}

function drawMediumSymbol(svg, x, y, rand) {
  const s = GRID * 0.6;

  const choices = [
    () => {
      svg.push(`<line x1="${x - s / 2}" y1="${y - s / 2}" x2="${x + s / 2}" y2="${y + s / 2}"/>`);
      svg.push(`<line x1="${x + s / 2}" y1="${y - s / 2}" x2="${x - s / 2}" y2="${y + s / 2}"/>`);
    },

    () => {
      svg.push(`<line x1="${x - s / 2}" y1="${y + s / 2}" x2="${x + s / 2}" y2="${y - s / 2}"/>`);
    },

    () => {
      svg.push(`
        <g opacity="0.55">
          <line x1="${x - s / 2}" y1="${y}" x2="${x + s / 2}" y2="${y}"/>
          <line x1="${x}" y1="${y - s / 2}" x2="${x}" y2="${y + s / 2}"/>
        </g>
      `);
    },

    () => {
      svg.push(`
        <rect 
          x="${x - s / 3}" 
          y="${y - s / 3}" 
          width="${s / 1.5}" 
          height="${s / 1.5}" 
          fill="none"
        />
      `);
    }
  ];

  choices[Math.floor(rand() * choices.length)]();
}

function drawLightSymbol(svg, x, y, rand, scale = 1) {
  const roll = rand();

  if (roll < 0.45) {
    svg.push(`<circle cx="${x}" cy="${y}" r="${GRID * 0.1 * scale}" stroke="none"/>`);
  } else if (roll < 0.75) {
    svg.push(`
      <line 
        x1="${x - GRID * 0.25 * scale}" 
        y1="${y + GRID * 0.25 * scale}" 
        x2="${x + GRID * 0.25 * scale}" 
        y2="${y - GRID * 0.25 * scale}"
      />
    `);
  } else {
    svg.push(`
      <g opacity="0.45">
        <line x1="${x - GRID * 0.22 * scale}" y1="${y}" x2="${x + GRID * 0.22 * scale}" y2="${y}"/>
        <line x1="${x}" y1="${y - GRID * 0.22 * scale}" x2="${x}" y2="${y + GRID * 0.22 * scale}"/>
      </g>
    `);
  }
}

/* -----------------------------
   Triangle renderer
-------------------------------- */

function renderTriangleGlyph(svg, state, width, height, rand) {
  const letterMap = getTriangleLetterPixels(state.text, state.letterSize);
  const occupied = getTriangleOccupiedCells(letterMap, width, height);

  drawTriangleField(svg, width, height, state.color, state.bgIntensity, rand);
  drawTriangleGlyphBody(svg, occupied, state.color, state.intensity, state.messiness, rand);
  drawTriangleGlyphEdges(svg, occupied, state.color, state.messiness, rand, width, height);
}

function getTriangleOccupiedCells(letterMap, width, height) {
  const letterCols = letterMap[0].length;
  const letterRows = letterMap.length;

  const startX = Math.floor((width / TRI_GRID - letterCols) / 2);
  const startY = Math.floor((height / TRI_GRID - letterRows) / 2);

  const occupied = new Set();

  for (let y = 0; y < letterMap.length; y++) {
    for (let x = 0; x < letterMap[y].length; x++) {
      if (letterMap[y][x] === "1") {
        occupied.add(`${startX + x},${startY + y}`);
      }
    }
  }

  return occupied;
}

function drawTriangleField(svg, width, height, color, bgIntensity, rand) {
  const cols = Math.floor(width / TRI_GRID);
  const rows = Math.floor(height / TRI_GRID);
  const patches = 18 + Math.floor(bgIntensity * 0.38);

  svg.push(`
    <g fill="${color}" stroke="${color}" stroke-width="0.9" stroke-linejoin="miter" color="${color}" opacity="0.42" filter="url(#triGlow)">
  `);

  for (let i = 0; i < patches; i++) {
    const startX = Math.floor(rand() * cols);
    const startY = Math.floor(rand() * rows);
    const patchWidth = 3 + Math.floor(rand() * 10);
    const patchHeight = 3 + Math.floor(rand() * 14);
    const density = 0.22 + rand() * 0.42;
    const diagonalMode = rand();

    for (let y = 0; y < patchHeight; y++) {
      for (let x = 0; x < patchWidth; x++) {
        const gx = startX + x;
        const gy = startY + y;

        if (!insideTriBounds(gx, gy, width, height)) continue;

        let keep = rand() < density;

        if (diagonalMode < 0.55) {
          keep = keep && Math.abs(x - y) < 3 + rand() * 2;
        } else if (diagonalMode < 0.8) {
          keep = keep && Math.abs(patchWidth - x - y) < 3 + rand() * 2;
        }

        if (!keep && rand() > 0.05) continue;

        const px = gx * TRI_GRID + TRI_GRID / 2;
        const py = gy * TRI_GRID + TRI_GRID / 2;

        svg.push(`<g opacity="${rand() * 0.35 + 0.16}">`);

        if (rand() < 0.58) {
          drawTinyTriangle(svg, px, py, TRI_GRID * 0.8, Math.floor(rand() * 4), rand, false);
        } else {
          drawPixelDot(svg, px, py, TRI_GRID * 0.16);
        }

        svg.push(`</g>`);
      }
    }
  }

  const strayDots = 80 + bgIntensity * 5;

  for (let i = 0; i < strayDots; i++) {
    const gx = Math.floor(rand() * cols);
    const gy = Math.floor(rand() * rows);

    const px = gx * TRI_GRID + TRI_GRID / 2;
    const py = gy * TRI_GRID + TRI_GRID / 2;

    svg.push(`<g opacity="${rand() * 0.25 + 0.08}">`);

    if (rand() < 0.74) {
      drawPixelDot(svg, px, py, TRI_GRID * 0.16);
    } else {
      drawTinyTriangle(svg, px, py, TRI_GRID * 0.55, Math.floor(rand() * 4), rand, false);
    }

    svg.push(`</g>`);
  }

  svg.push(`</g>`);
}

function drawTriangleGlyphBody(svg, occupied, color, intensity, messiness, rand) {
  const skipChance = messiness / 1200;
  const dotChance = 0.28 - intensity / 600;
  const fillChance = 0.92 + intensity / 900;

  svg.push(`
    <g fill="${color}" stroke="${color}" stroke-width="0.95" stroke-linejoin="miter" color="${color}" filter="url(#triGlow)">
  `);

  occupied.forEach(key => {
    if (rand() < skipChance) return;
    if (rand() > fillChance) return;

    const [gx, gy] = key.split(",").map(Number);
    const px = gx * TRI_GRID + TRI_GRID / 2;
    const py = gy * TRI_GRID + TRI_GRID / 2;

    const neighborCount = countTriNeighbors(gx, gy, occupied);
    const isCore = neighborCount >= 5;

    if (rand() < dotChance && !isCore) {
      drawPixelDot(svg, px, py, TRI_GRID * 0.18);
      return;
    }

    const rotation = chooseTriangleRotation(gx, gy, occupied, rand);
    const size = TRI_GRID * (0.72 + rand() * 0.36);

    drawTinyTriangle(svg, px, py, size, rotation, rand, false);
  });

  svg.push(`</g>`);
}

function drawTriangleGlyphEdges(svg, occupied, color, messiness, rand, width, height) {
  const edgeCells = [];

  occupied.forEach(key => {
    const [gx, gy] = key.split(",").map(Number);
    if (countTriNeighbors(gx, gy, occupied) < 5) {
      edgeCells.push([gx, gy]);
    }
  });

  const amount = Math.floor(edgeCells.length * (messiness / 100) * 0.85);

  svg.push(`
    <g fill="${color}" stroke="${color}" stroke-width="0.8" stroke-linejoin="miter" color="${color}" opacity="0.68" filter="url(#triGlow)">
  `);

  for (let i = 0; i < amount; i++) {
    const [gx, gy] = edgeCells[Math.floor(rand() * edgeCells.length)];

    const offsets = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1]
    ];

    const [ox, oy] = offsets[Math.floor(rand() * offsets.length)];
    const nx = gx + ox;
    const ny = gy + oy;

    if (occupied.has(`${nx},${ny}`)) continue;
    if (!insideTriBounds(nx, ny, width, height)) continue;

    const px = nx * TRI_GRID + TRI_GRID / 2;
    const py = ny * TRI_GRID + TRI_GRID / 2;

    if (rand() < 0.65) {
      drawTinyTriangle(svg, px, py, TRI_GRID * 0.66, Math.floor(rand() * 4), rand, false);
    } else {
      drawPixelDot(svg, px, py, TRI_GRID * 0.15);
    }
  }

  svg.push(`</g>`);
}

function chooseTriangleRotation(gx, gy, occupied, rand) {
  const right = occupied.has(`${gx + 1},${gy}`);
  const left = occupied.has(`${gx - 1},${gy}`);
  const up = occupied.has(`${gx},${gy - 1}`);
  const down = occupied.has(`${gx},${gy + 1}`);

  if (right && down && !left) return 1;
  if (left && down && !right) return 3;
  if (right && up && !left) return 1;
  if (left && up && !right) return 3;
  if (down && !up) return 2;
  if (up && !down) return 0;

  return Math.floor(rand() * 4);
}

function drawTinyTriangle(svg, x, y, s, rotation, rand, filled = false) {
  const pointsByRotation = [
    [[0, -0.56], [0.5, 0.44], [-0.5, 0.44]],
    [[0.56, 0], [-0.44, 0.5], [-0.44, -0.5]],
    [[0, 0.56], [0.5, -0.44], [-0.5, -0.44]],
    [[-0.56, 0], [0.44, 0.5], [0.44, -0.5]]
  ];

  const pts = pointsByRotation[rotation].map(([px, py]) => {
    const jitter = s * 0.07;

    return [
      x + px * s + (rand() - 0.5) * jitter,
      y + py * s + (rand() - 0.5) * jitter
    ];
  });

  const pointString = pts.map(p => `${p[0]},${p[1]}`).join(" ");
  svg.push(`<polygon points="${pointString}" fill="${filled ? "currentColor" : "none"}"/>`);
}

function drawPixelDot(svg, x, y, s) {
  svg.push(`<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" stroke="none"/>`);
}

function insideBounds(gx, gy, width, height) {
  return gx >= 0 && gy >= 0 && gx * GRID < width && gy * GRID < height;
}

function insideTriBounds(gx, gy, width, height) {
  return gx >= 0 && gy >= 0 && gx * TRI_GRID < width && gy * TRI_GRID < height;
}

function countNeighbors(gx, gy, occupied) {
  let count = 0;

  for (let y = -1; y <= 1; y++) {
    for (let x = -1; x <= 1; x++) {
      if (x === 0 && y === 0) continue;
      if (occupied.has(`${gx + x},${gy + y}`)) count++;
    }
  }

  return count;
}

function countTriNeighbors(gx, gy, occupied) {
  let count = 0;

  for (let y = -1; y <= 1; y++) {
    for (let x = -1; x <= 1; x++) {
      if (x === 0 && y === 0) continue;
      if (occupied.has(`${gx + x},${gy + y}`)) count++;
    }
  }

  return count;
}