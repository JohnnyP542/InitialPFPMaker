import {
  getCanvasDimensions,
  getClipPath,
  getBackgroundShape,
  getBorderShape,
  escapeHTML,
  mapRange
} from "./svgUtils.js";

export function renderSwissMode(state) {
  const { width, height } = getCanvasDimensions(state.shape);
  const clipId = "artClip";
  const chars = state.text.split("");

  const fontFamily = getSwissFontFamily(state.swissFont);
  const fontScale = chars.length === 3 ? 0.78 : 1;
  const fontSize = Math.min(width, height) * 0.62 * state.letterSize * fontScale;

  const spacing = mapRange(state.overlap, 0, 100, fontSize * 0.82, fontSize * 0.34);
  const centerX = width / 2;
  const centerY = height / 2 + fontSize * 0.12;
  const splitOffset = state.letterVerticalSplit * 1.2;
  const blur = getBlurOffsets(state.blurDirection, state.blurAmount);

  const background = renderSwissBackground(width, height, state);
  const micrographics = renderSwissMicrographics(width, height, state);
  const letters = renderSwissLetters(chars, {
    centerX,
    centerY,
    spacing,
    splitOffset,
    fontSize,
    fontFamily,
    blur,
    state
  });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        ${getClipPath(state.shape, width, height, clipId)}

        <style>
          .swiss-editable {
            cursor: pointer;
            transition: opacity 120ms ease, filter 120ms ease;
          }

          .swiss-editable:hover {
            filter: brightness(1.3) contrast(1.12);
            opacity: 1 !important;
          }
        </style>

        <filter id="swissBlur" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="${state.blurAmount * 0.18}" />
        </filter>

        <filter id="borderGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.1" flood-color="${state.borderColor}" flood-opacity="0.7"/>
        </filter>
      </defs>

      ${getBackgroundShape(state.shape, width, height, state.bgColor, true)}

      <g clip-path="url(#${clipId})">
        ${background}
        ${state.prioritizeLetters ? micrographics + letters : letters + micrographics}
      </g>

      ${getBorderShape(state.shape, width, height, state.borderColor, state.borderThickness, true)}
    </svg>
  `;
}

function renderSwissLetters(chars, options) {
  const { centerX, centerY, spacing, splitOffset, fontSize, fontFamily, blur, state } = options;
  const totalWidth = spacing * (chars.length - 1);

  const fillPalette = [state.color, state.accentTwo, state.accentThree];
  const outlinePalette = [state.color, state.accentThree, state.accentOne];

  let ghosts = "";
  let fills = "";
  let outlines = "";

  chars.forEach((char, index) => {
    const x = centerX - totalWidth / 2 + index * spacing;
    const verticalDirection = chars.length === 3 ? index - 1 : index === 0 ? -1 : 1;
    const y = centerY + verticalDirection * splitOffset;

    const blurX = index % 2 === 0 ? blur.x : -blur.x;
    const blurY = index % 2 === 0 ? blur.y : -blur.y;

    const colorTarget = index === 0 ? "color" : index === 1 ? "accentTwo" : "accentThree";
    const fillColor = fillPalette[index % fillPalette.length];
    const outlineColor = outlinePalette[index % outlinePalette.length];

    ghosts += renderGhostLetter(char, x, y, fontSize, state.accentOne, blurX, blurY, fontFamily);
    fills += renderSwissLetter(char, x, y, fontSize, fillColor, state.prioritizeLetters ? 1 : 0.92, false, fontFamily, colorTarget);
    outlines += renderSwissLetter(char, x, y, fontSize, outlineColor, state.prioritizeLetters ? 0.88 : 0.55, true, fontFamily, colorTarget);
  });

  if (state.prioritizeLetters) {
    return `
      <g>${ghosts}</g>
      <g>${fills}</g>
      <g opacity="1">${outlines}</g>
    `;
  }

  return `
    <g style="mix-blend-mode: screen;">${ghosts}</g>
    <g style="mix-blend-mode: multiply;">${fills}</g>
    <g opacity="0.9">${outlines}</g>
  `;
}

function renderSwissLetter(letter, x, y, size, color, opacity, outline, fontFamily, colorTarget) {
  const label = colorTarget === "color" ? "Main Letter Color" : "Letter Accent Color";

  if (outline) {
    return `
      <text
        class="swiss-editable"
        data-color-target="${colorTarget}"
        data-label="${label}"
        x="${x}"
        y="${y}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="${fontFamily}"
        font-size="${size}"
        font-weight="900"
        fill="none"
        stroke="${color}"
        stroke-width="${size * 0.018}"
        opacity="${opacity}"
      >${escapeHTML(letter)}</text>
    `;
  }

  return `
    <text
      class="swiss-editable"
      data-color-target="${colorTarget}"
      data-label="${label}"
      x="${x}"
      y="${y}"
      text-anchor="middle"
      dominant-baseline="middle"
      font-family="${fontFamily}"
      font-size="${size}"
      font-weight="900"
      fill="${color}"
      opacity="${opacity}"
    >${escapeHTML(letter)}</text>
  `;
}

function renderGhostLetter(letter, x, y, size, color, dx, dy, fontFamily) {
  let output = "";

  for (let i = 1; i <= 5; i++) {
    output += `
      <text
        class="swiss-editable"
        data-color-target="accentOne"
        data-label="Blur / Ghost Accent"
        x="${x + dx * i}"
        y="${y + dy * i}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="${fontFamily}"
        font-size="${size}"
        font-weight="900"
        fill="${color}"
        opacity="${0.075 / i}"
      >${escapeHTML(letter)}</text>
    `;
  }

  return output;
}

function renderSwissBackground(width, height, state) {
  const opacity = state.swissBgOpacity;
  const strong = opacity;
  const mid = opacity * 0.85;
  const soft = opacity * 0.68;

  const c1 = state.accentOne;
  const c2 = state.accentTwo;
  const c3 = state.accentThree;

  const styles = {
    posterBlocks: () => posterBlocks(width, height, c1, c2, c3, strong, mid),
    radialTarget: () => radialTarget(width, height, c1, c2, c3, strong, mid, soft),
    diagonalSystem: () => diagonalSystem(width, height, c1, c2, c3, strong, mid, soft),
    opArt: () => opArt(width, height, c1, c2, c3, strong, mid, soft),
    albumGrid: () => albumGrid(width, height, c1, c2, c3, strong, mid)
  };

  return (styles[state.swissBgStyle] || styles.posterBlocks)();
}

function posterBlocks(width, height, c1, c2, c3, strong, mid) {
  return `
    <g class="swiss-editable" data-color-target="accentOne" data-label="Accent 1 / Panels">
      <rect x="0" y="0" width="${width * 0.34}" height="${height}" fill="${c1}" opacity="${mid}"/>
      <polygon points="${width},${height} ${width * 0.58},${height} ${width},${height * 0.42}" fill="${c1}" opacity="${mid}"/>
      <circle cx="${width * 0.28}" cy="${height * 0.72}" r="${Math.min(width, height) * 0.16}" fill="${c1}" opacity="${mid}"/>
    </g>

    <g class="swiss-editable" data-color-target="accentTwo" data-label="Accent 2 / Diagonal">
      <polygon points="0,${height} ${width * 0.46},${height} ${width},0 ${width * 0.72},0" fill="${c2}" opacity="${strong}"/>
    </g>

    <g class="swiss-editable" data-color-target="accentThree" data-label="Accent 3 / Circles + Lines">
      <rect x="${width * 0.64}" y="0" width="${width * 0.36}" height="${height}" fill="${c3}" opacity="${mid}"/>
      <circle cx="${width * 0.72}" cy="${height * 0.32}" r="${Math.min(width, height) * 0.18}" fill="${c3}" opacity="${mid}"/>
      <line x1="${width * 0.08}" y1="${height * 0.22}" x2="${width * 0.34}" y2="${height * 0.22}" stroke="${c3}" stroke-width="3" opacity="${strong}"/>
      <line x1="${width * 0.66}" y1="${height * 0.82}" x2="${width * 0.92}" y2="${height * 0.82}" stroke="${c3}" stroke-width="3" opacity="${strong}"/>
    </g>
  `;
}

function radialTarget(width, height, c1, c2, c3, strong, mid, soft) {
  return `
    <g class="swiss-editable" data-color-target="accentOne" data-label="Accent 1 / Target Rings">
      <circle cx="${width * 0.5}" cy="${height * 0.5}" r="${Math.min(width, height) * 0.48}" fill="${c1}" opacity="${soft}"/>
      <rect x="0" y="${height * 0.44}" width="${width}" height="${height * 0.12}" fill="${c1}" opacity="${soft}"/>
      <polygon points="${width},${height} ${width * 0.68},${height} ${width},${height * 0.68}" fill="${c1}" opacity="${strong}"/>
    </g>

    <g class="swiss-editable" data-color-target="accentTwo" data-label="Accent 2 / Target Wedges">
      <circle cx="${width * 0.5}" cy="${height * 0.5}" r="${Math.min(width, height) * 0.36}" fill="${c2}" opacity="${mid}"/>
      <polygon points="0,0 ${width * 0.32},0 0,${height * 0.32}" fill="${c2}" opacity="${strong}"/>
    </g>

    <g class="swiss-editable" data-color-target="accentThree" data-label="Accent 3 / Center + Crossbar">
      <circle cx="${width * 0.5}" cy="${height * 0.5}" r="${Math.min(width, height) * 0.23}" fill="${c3}" opacity="${mid}"/>
      <rect x="${width * 0.44}" y="0" width="${width * 0.12}" height="${height}" fill="${c3}" opacity="${soft}"/>
    </g>
  `;
}

function diagonalSystem(width, height, c1, c2, c3, strong, mid, soft) {
  return `
    <g class="swiss-editable" data-color-target="accentOne" data-label="Accent 1 / Main Diagonal">
      <polygon points="0,${height} ${width * 0.18},${height} ${width * 0.72},0 ${width * 0.54},0" fill="${c1}" opacity="${strong}"/>
      <rect x="0" y="0" width="${width * 0.33}" height="${height}" fill="${c1}" opacity="${soft}"/>
    </g>

    <g class="swiss-editable" data-color-target="accentTwo" data-label="Accent 2 / Secondary Diagonal">
      <polygon points="${width * 0.25},${height} ${width * 0.52},${height} ${width},${height * 0.08} ${width},0 ${width * 0.82},0" fill="${c2}" opacity="${mid}"/>
      <circle cx="${width * 0.22}" cy="${height * 0.78}" r="${Math.min(width, height) * 0.14}" fill="${c2}" opacity="${soft}"/>
    </g>

    <g class="swiss-editable" data-color-target="accentThree" data-label="Accent 3 / Outer Geometry">
      <polygon points="0,0 ${width * 0.42},0 ${width},${height * 0.72} ${width},${height} ${width * 0.74},${height}" fill="${c3}" opacity="${soft}"/>
      <circle cx="${width * 0.78}" cy="${height * 0.22}" r="${Math.min(width, height) * 0.14}" fill="${c3}" opacity="${mid}"/>
    </g>
  `;
}

function opArt(width, height, c1, c2, c3, strong, mid, soft) {
  const cx = width / 2;
  const cy = height / 2;
  const rays = 32;
  const radius = Math.hypot(width, height);

  let accentRays = "";
  let darkRays = "";

  for (let i = 0; i < rays; i++) {
    const a1 = (Math.PI * 2 * i) / rays;
    const a2 = (Math.PI * 2 * (i + 0.5)) / rays;

    const poly = `
      <polygon
        points="${cx},${cy} ${cx + Math.cos(a1) * radius},${cy + Math.sin(a1) * radius} ${cx + Math.cos(a2) * radius},${cy + Math.sin(a2) * radius}"
      />
    `;

    if (i % 2 === 0) {
      accentRays += poly;
    } else {
      darkRays += poly;
    }
  }

  return `
    <g class="swiss-editable" data-color-target="accentOne" data-label="Accent 1 / Field">
      <rect x="0" y="0" width="${width}" height="${height}" fill="${c1}" opacity="${soft}"/>
    </g>

    <g class="swiss-editable" data-color-target="accentTwo" data-label="Accent 2 / Burst">
      <g fill="${c2}" opacity="${mid}">
        ${accentRays}
      </g>
    </g>

    <g class="swiss-editable" data-color-target="accentThree" data-label="Accent 3 / Center">
      <circle cx="${cx}" cy="${cy}" r="${Math.min(width, height) * 0.19}" fill="${c3}" opacity="${mid}"/>
      <circle cx="${cx}" cy="${cy}" r="${Math.min(width, height) * 0.09}" fill="#05050a" opacity="${strong}"/>
    </g>

    <g fill="#05050a" opacity="${strong}">
      ${darkRays}
    </g>
  `;
}

function albumGrid(width, height, c1, c2, c3, strong, mid) {
  return `
    <g class="swiss-editable" data-color-target="accentOne" data-label="Accent 1 / Grid Blocks">
      <rect x="0" y="0" width="${width * 0.5}" height="${height * 0.5}" fill="${c1}" opacity="${mid}"/>
      <circle cx="${width * 0.75}" cy="${height * 0.75}" r="${Math.min(width, height) * 0.14}" fill="${c1}" opacity="${strong}"/>
    </g>

    <g class="swiss-editable" data-color-target="accentTwo" data-label="Accent 2 / Grid Blocks">
      <rect x="0" y="${height * 0.5}" width="${width * 0.5}" height="${height * 0.5}" fill="${c2}" opacity="${strong}"/>
      <circle cx="${width * 0.75}" cy="${height * 0.25}" r="${Math.min(width, height) * 0.14}" fill="${c2}" opacity="${strong}"/>
    </g>

    <g class="swiss-editable" data-color-target="accentThree" data-label="Accent 3 / Grid Blocks">
      <rect x="${width * 0.5}" y="0" width="${width * 0.5}" height="${height * 0.5}" fill="${c3}" opacity="${mid}"/>
      <circle cx="${width * 0.25}" cy="${height * 0.75}" r="${Math.min(width, height) * 0.14}" fill="${c3}" opacity="${strong}"/>
    </g>

    <g fill="#05050a" opacity="${mid}">
      <rect x="${width * 0.5}" y="${height * 0.5}" width="${width * 0.5}" height="${height * 0.5}"/>
      <circle cx="${width * 0.25}" cy="${height * 0.25}" r="${Math.min(width, height) * 0.14}"/>
    </g>

    <g fill="#f5f0df" opacity="${strong}">
      <polygon points="0,0 ${width * 0.5},0 0,${height * 0.5}"/>
      <polygon points="${width},${height} ${width * 0.5},${height} ${width},${height * 0.5}"/>
    </g>
  `;
}

function renderSwissMicrographics(width, height, state) {
  const opacity = state.swissBgOpacity;

  return `
    <g class="swiss-editable" data-color-target="accentThree" data-label="Accent 3 / Micro Lines" stroke="${state.accentThree}" stroke-width="2" opacity="${Math.max(0.65, opacity)}">
      <line x1="${width * 0.08}" y1="${height * 0.18}" x2="${width * 0.34}" y2="${height * 0.18}" />
      <line x1="${width * 0.66}" y1="${height * 0.82}" x2="${width * 0.92}" y2="${height * 0.82}" />
      <rect x="${width * 0.08}" y="${height * 0.78}" width="${width * 0.08}" height="${height * 0.08}" fill="none"/>
      <rect x="${width * 0.82}" y="${height * 0.12}" width="${width * 0.08}" height="${height * 0.08}" fill="none"/>
    </g>

    <g class="swiss-editable" data-color-target="accentOne" data-label="Accent 1 / Micro Dots" fill="${state.accentOne}" opacity="${Math.max(0.6, opacity * 0.85)}">
      <circle cx="${width * 0.14}" cy="${height * 0.14}" r="4"/>
      <circle cx="${width * 0.86}" cy="${height * 0.86}" r="4"/>
      <rect x="${width * 0.48}" y="${height * 0.08}" width="6" height="6"/>
      <rect x="${width * 0.52}" y="${height * 0.9}" width="6" height="6"/>
    </g>
  `;
}

function getSwissFontFamily(fontKey) {
  if (fontKey === "helvetica") return "Helvetica, Arial, sans-serif";
  if (fontKey === "georgia") return "Georgia, Times New Roman, serif";
  return "Arial Black, Helvetica, sans-serif";
}

function getBlurOffsets(direction, amount) {
  if (direction === "horizontal") return { x: amount * 0.9, y: 0 };
  if (direction === "diagonal") return { x: amount * 0.65, y: amount * 0.65 };
  return { x: 0, y: amount * 0.9 };
}