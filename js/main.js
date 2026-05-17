import { getControls, readState } from "./state.js";
import { renderDigitalMode } from "./digitalMode.js";
import { renderSwissMode } from "./swissMode.js";
import {
  renderInlinePreview,
  renderSvgToCanvas,
  downloadCanvasAsPng
} from "./exportPng.js";

const controls = getControls();

const svgPreview = document.getElementById("svgPreview");
const pngCanvas = document.getElementById("pngCanvas");

let latestSvg = "";

const floatingEditor = createFloatingEditor();

document.getElementById("generate").addEventListener("click", renderApp);
document.getElementById("download").addEventListener("click", () => {
  renderSvgToCanvas(pngCanvas, latestSvg, controls.canvasShape.value);

  setTimeout(() => {
    downloadCanvasAsPng(pngCanvas);
  }, 80);
});

document.getElementById("matchBorder").addEventListener("click", () => {
  controls.borderColor.value = controls.color.value;
  renderApp();
});

document.getElementById("randomizeSwiss").addEventListener("click", () => {
  randomizeSwissControls();
  renderApp();
});

Object.values(controls).forEach(control => {
  control.addEventListener("input", renderApp);
});

svgPreview.addEventListener("mousemove", event => {
  const target = event.target.closest(".swiss-editable");

  if (!target || controls.styleMode.value !== "swiss") {
    floatingEditor.style.display = "none";
    return;
  }

  floatingEditor.style.display = "block";
  floatingEditor.style.left = `${event.clientX + 16}px`;
  floatingEditor.style.top = `${event.clientY + 16}px`;
  floatingEditor.textContent = `Click to edit: ${target.dataset.label}`;
});

svgPreview.addEventListener("mouseleave", () => {
  floatingEditor.style.display = "none";
});

svgPreview.addEventListener("click", event => {
  const target = event.target.closest(".swiss-editable");

  if (!target || controls.styleMode.value !== "swiss") return;

  const input = document.getElementById(target.dataset.colorTarget);

  if (input) input.click();
});

function renderApp() {
  const state = readState(controls);

  updateModeVisibility(state.mode);

  latestSvg =
    state.mode === "swiss"
      ? renderSwissMode(state)
      : renderDigitalMode(state);

  renderInlinePreview(svgPreview, latestSvg);
  renderSvgToCanvas(pngCanvas, latestSvg, state.shape);
}

function updateModeVisibility(mode) {
  const isSwiss = mode === "swiss";

  document.body.classList.toggle("mode-swiss", isSwiss);
  document.body.classList.toggle("mode-digital", !isSwiss);

  document.querySelectorAll(".swiss-control").forEach(group => {
    group.style.display = isSwiss ? "block" : "none";
  });

  document.querySelectorAll(".digital-control").forEach(group => {
    group.style.display = isSwiss ? "none" : "block";
  });
}

function createFloatingEditor() {
  const editor = document.createElement("div");

  editor.id = "floatingEditor";
  editor.style.position = "fixed";
  editor.style.display = "none";
  editor.style.zIndex = "9999";
  editor.style.background = "#f3ead2";
  editor.style.color = "#151714";
  editor.style.border = "2px solid #151714";
  editor.style.boxShadow = "4px 4px 0 #000";
  editor.style.padding = "8px 10px";
  editor.style.fontFamily = "Courier New, monospace";
  editor.style.fontSize = "12px";
  editor.style.fontWeight = "bold";
  editor.style.pointerEvents = "none";

  document.body.appendChild(editor);

  return editor;
}

function randomizeSwissControls() {
  const palettes = [
    ["#ccff00", "#ff2f5f", "#24d8d2", "#10140f", "#ccff00"],
    ["#ff6a2a", "#3158ff", "#f4efdf", "#ffffff", "#ff6a2a"],
    ["#00e5ff", "#ffea00", "#ff006e", "#f4f0e4", "#111111"],
    ["#d8ff00", "#6c4cff", "#ff4f1f", "#050505", "#d8ff00"],
    ["#1d1dff", "#ff3131", "#f2efe2", "#ffffff", "#111111"],
    ["#f7ff00", "#ff0066", "#00d5ff", "#0c0f08", "#f7ff00"],
    ["#8fff00", "#ff4d00", "#00f0b5", "#121212", "#8fff00"],
    ["#00ffcc", "#ff2975", "#fff000", "#f8f8f2", "#00ffcc"],
    ["#ff3c78", "#4dffb8", "#3158ff", "#f5f2e8", "#111111"],
    ["#ffe600", "#00d0ff", "#ff005d", "#0b0e12", "#ffe600"],
    ["#ff5f1f", "#7b61ff", "#00ffc8", "#f7f1e3", "#ff5f1f"],
    ["#00ffa6", "#ff2a6d", "#ffe66d", "#0d1117", "#00ffa6"],
    ["#d0ff00", "#ff0088", "#00bbff", "#f3f0df", "#d0ff00"],
    ["#ffffff", "#ff004c", "#1e90ff", "#111111", "#ffffff"],
    ["#00f7ff", "#ff9500", "#c4ff00", "#161616", "#00f7ff"],
    ["#ff0040", "#00ff87", "#00b7ff", "#f6f2e9", "#111111"],
    ["#ffcc00", "#ff006e", "#8338ec", "#0d0d0d", "#ffcc00"],
    ["#00ffea", "#ff3d00", "#d9ff00", "#f4f1e8", "#00ffea"],
    ["#9dff00", "#ff0055", "#00c2ff", "#05070a", "#9dff00"],
    ["#ff7b00", "#00ffcc", "#3158ff", "#f8f6ee", "#111111"],
    ["#39ff14", "#ff2079", "#00e5ff", "#0a0c08", "#39ff14"],
    ["#e1ff00", "#ff6b00", "#00ffd9", "#f0ede4", "#111111"],
    ["#00ffa2", "#ff0059", "#ffd500", "#111315", "#00ffa2"],
    ["#ff2f92", "#00ffbf", "#7a5cff", "#f5f0e7", "#111111"],
    ["#d4ff00", "#00bfff", "#ff4400", "#080a0c", "#d4ff00"]
  ];

  const styles = [
    "posterBlocks",
    "radialTarget",
    "diagonalSystem",
    "opArt",
    "albumGrid"
  ];

  const palette = palettes[Math.floor(Math.random() * palettes.length)];

  controls.color.value = palette[0];
  controls.accentOne.value = palette[0];
  controls.accentTwo.value = palette[1];
  controls.accentThree.value = palette[2];
  controls.bgColor.value = palette[3];
  controls.borderColor.value = palette[4];

  controls.swissBgStyle.value = styles[Math.floor(Math.random() * styles.length)];
  controls.swissBgOpacity.value = Math.floor(55 + Math.random() * 40);
}

renderApp();