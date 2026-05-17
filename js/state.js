export function getControls() {
  return {
    letters: document.getElementById("letters"),
    styleMode: document.getElementById("styleMode"),
    canvasShape: document.getElementById("canvasShape"),

    color: document.getElementById("color"),
    bgColor: document.getElementById("bgColor"),
    borderColor: document.getElementById("borderColor"),

    borderThickness: document.getElementById("borderThickness"),
    letterSize: document.getElementById("letterSize"),

    digitalPattern: document.getElementById("digitalPattern"),
    intensity: document.getElementById("intensity"),
    bgIntensity: document.getElementById("bgIntensity"),
    messiness: document.getElementById("messiness"),

    prioritizeLetters: document.getElementById("prioritizeLetters"),
    swissBgStyle: document.getElementById("swissBgStyle"),
    swissBgOpacity: document.getElementById("swissBgOpacity"),
    swissFont: document.getElementById("swissFont"),
    overlap: document.getElementById("overlap"),
    letterVerticalSplit: document.getElementById("letterVerticalSplit"),
    blurAmount: document.getElementById("blurAmount"),
    blurDirection: document.getElementById("blurDirection"),

    accentOne: document.getElementById("accentOne"),
    accentTwo: document.getElementById("accentTwo"),
    accentThree: document.getElementById("accentThree")
  };
}

export function readState(controls) {
  return {
    text: cleanLetters(controls.letters.value),
    mode: controls.styleMode.value,
    shape: controls.canvasShape.value,

    color: controls.color.value,
    bgColor: controls.bgColor.value,
    borderColor: controls.borderColor.value,

    borderThickness: Number(controls.borderThickness.value),
    letterSize: Number(controls.letterSize.value) / 100,

    digitalPattern: controls.digitalPattern.value,
    intensity: Number(controls.intensity.value),
    bgIntensity: Number(controls.bgIntensity.value),
    messiness: Number(controls.messiness.value),

    prioritizeLetters: controls.prioritizeLetters.checked,
    swissBgStyle: controls.swissBgStyle.value,
    swissBgOpacity: Number(controls.swissBgOpacity.value) / 100,
    swissFont: controls.swissFont.value,
    overlap: Number(controls.overlap.value),
    letterVerticalSplit: Number(controls.letterVerticalSplit.value),
    blurAmount: Number(controls.blurAmount.value),
    blurDirection: controls.blurDirection.value,

    accentOne: controls.accentOne.value,
    accentTwo: controls.accentTwo.value,
    accentThree: controls.accentThree.value
  };
}

export function cleanLetters(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "AB";
}