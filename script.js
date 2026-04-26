const canvas = document.getElementById("memeCanvas");
const ctx = canvas.getContext("2d");

const templateSelect = document.getElementById("templateSelect");
const imageUpload = document.getElementById("imageUpload");
const topTextInput = document.getElementById("topText");
const bottomTextInput = document.getElementById("bottomText");
const topSizeRange = document.getElementById("topSizeRange");
const topSizeNumber = document.getElementById("topSizeNumber");
const bottomSizeRange = document.getElementById("bottomSizeRange");
const bottomSizeNumber = document.getElementById("bottomSizeNumber");
const textColorInput = document.getElementById("textColor");
const downloadBtn = document.getElementById("downloadBtn");

const TEMPLATE_ASSETS = [
  {
    label: "screenshot_2026-04-26_192708-meme",
    path: "./meme_assets/screenshot_2026-04-26_192708-meme.png"
  }
];
const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif)$/i;

const state = {
  currentImage: null,
  imageName: "meme-template"
};

function getBaseName(path) {
  return path.split("/").pop().replace(/\.[^/.]+$/, "");
}

function populateTemplateSelect() {
  templateSelect.innerHTML = "";
  TEMPLATE_ASSETS.forEach((asset) => {
    const option = document.createElement("option");
    option.value = asset.path;
    option.textContent = asset.label;
    templateSelect.append(option);
  });
}

async function loadTemplatesFromFolder() {
  try {
    const response = await fetch("./meme_assets/");
    if (!response.ok) {
      return;
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const links = Array.from(doc.querySelectorAll("a"));

    const discoveredAssets = links
      .map((link) => link.getAttribute("href") || "")
      .filter((href) => IMAGE_EXTENSIONS.test(href))
      .map((href) => {
        const cleanHref = href.replace(/^\.?\//, "");
        const fileName = cleanHref.split("/").pop();
        return {
          label: fileName.replace(/\.[^/.]+$/, ""),
          path: `./meme_assets/${fileName}`
        };
      });

    if (discoveredAssets.length > 0) {
      TEMPLATE_ASSETS.length = 0;
      TEMPLATE_ASSETS.push(...discoveredAssets);
    }
  } catch (error) {
    // Keep fallback templates if directory listing is unavailable.
  }
}

function loadImageFromSource(source, name = "meme-template") {
  const image = new Image();
  image.onload = () => {
    state.currentImage = image;
    state.imageName = name;
    downloadBtn.disabled = false;
    drawMeme();
  };
  image.onerror = () => {
    alert("Image could not be loaded. Please pick a different file/template.");
  };
  image.src = source;
}

function fitImageToCanvas(image) {
  const canvasRatio = canvas.width / canvas.height;
  const imageRatio = image.width / image.height;

  let drawWidth = canvas.width;
  let drawHeight = canvas.height;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > canvasRatio) {
    drawHeight = canvas.height;
    drawWidth = image.width * (drawHeight / image.height);
    offsetX = (canvas.width - drawWidth) / 2;
  } else {
    drawWidth = canvas.width;
    drawHeight = image.height * (drawWidth / image.width);
    offsetY = (canvas.height - drawHeight) / 2;
  }

  return { drawWidth, drawHeight, offsetX, offsetY };
}

function drawOutlinedText(text, y, fontSize, baseline, fillColor) {
  const safeText = text.trim();
  if (!safeText) {
    return;
  }

  ctx.font = `900 ${fontSize}px Impact, "Arial Black", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = baseline;
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.strokeStyle = "#000";
  ctx.fillStyle = fillColor;
  ctx.lineWidth = Math.max(2, Math.floor(fontSize * 0.09));

  ctx.strokeText(safeText.toUpperCase(), canvas.width / 2, y);
  ctx.fillText(safeText.toUpperCase(), canvas.width / 2, y);
}

function drawMeme() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!state.currentImage) {
    ctx.fillStyle = "#e9e9e9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const { drawWidth, drawHeight, offsetX, offsetY } = fitImageToCanvas(state.currentImage);
  ctx.drawImage(state.currentImage, offsetX, offsetY, drawWidth, drawHeight);

  const topSize = Number(topSizeNumber.value);
  const bottomSize = Number(bottomSizeNumber.value);
  const textColor = textColorInput.value || "#ffffff";
  drawOutlinedText(topTextInput.value, 20, topSize, "top", textColor);
  drawOutlinedText(bottomTextInput.value, canvas.height - 20, bottomSize, "bottom", textColor);
}

function syncSizeInputs(source, target) {
  target.value = source.value;
  drawMeme();
}

templateSelect.addEventListener("change", () => {
  const source = templateSelect.value;
  loadImageFromSource(source, getBaseName(source));
});

imageUpload.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  loadImageFromSource(objectUrl, file.name.replace(/\.[^/.]+$/, ""));
});

topTextInput.addEventListener("input", drawMeme);
bottomTextInput.addEventListener("input", drawMeme);
topSizeRange.addEventListener("input", () => syncSizeInputs(topSizeRange, topSizeNumber));
topSizeNumber.addEventListener("input", () => syncSizeInputs(topSizeNumber, topSizeRange));
bottomSizeRange.addEventListener("input", () => syncSizeInputs(bottomSizeRange, bottomSizeNumber));
bottomSizeNumber.addEventListener("input", () => syncSizeInputs(bottomSizeNumber, bottomSizeRange));
textColorInput.addEventListener("input", drawMeme);

downloadBtn.addEventListener("click", () => {
  if (!state.currentImage) {
    return;
  }

  const link = document.createElement("a");
  const safeName = state.imageName.replace(/[^a-z0-9-_]/gi, "_").toLowerCase() || "meme";
  link.download = `${safeName}-meme.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

async function initialize() {
  await loadTemplatesFromFolder();
  populateTemplateSelect();
  if (templateSelect.value) {
    loadImageFromSource(templateSelect.value, getBaseName(templateSelect.value));
  }
}

initialize();
