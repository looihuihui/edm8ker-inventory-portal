// js/add.js (Firestore async)
import { ensureAuth } from "./firebase.js";
import { dbGetZones, dbAddItem } from "./db.js";
import { setActiveNav } from "./app.js";

setActiveNav("add");

const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");

const imgFileInput = document.getElementById("imgFileInput");
const changeImgBtn = document.getElementById("changeImgBtn");
const photoPreview = document.getElementById("photoPreview");

const addForm = document.getElementById("addForm");
const nameInput = document.getElementById("nameInput");
const binInput = document.getElementById("binInput");
const zoneSelect = document.getElementById("zoneSelect");
const qtyInput = document.getElementById("qtyInput");
const notesInput = document.getElementById("notesInput");

let imageUrl = "";

cancelBtn?.addEventListener("click", () => {
  window.location.replace("index.html");
});


function openItem(itemId) {
  const ret = encodeURIComponent(window.location.href);
  window.location.href = `item.html?id=${encodeURIComponent(itemId)}&return=${ret}`;
}

function renderImage() {
  if (!imageUrl) {
    photoPreview.textContent = "🖼️";
    return;
  }
  photoPreview.innerHTML = `<img src="${imageUrl}" alt="">`;
}

changeImgBtn?.addEventListener("click", () => imgFileInput?.click());

imgFileInput?.addEventListener("change", () => {
  const file = imgFileInput.files?.[0];
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = () => {
    imageUrl = String(reader.result || "");
    renderImage();
  };
  reader.readAsDataURL(file);

  imgFileInput.value = "";
});

function numOrZero(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function validate() {
  if (!nameInput.value.trim()) return "item name is required.";
  if (!binInput.value.trim()) return "bin number is required.";
  if (!zoneSelect.value) return "category type is required.";
  return "";
}

// Simple unique ID (NFC-friendly)
function makeItemId() {
  return `ITEM-${Date.now()}`;
}

async function save() {
  const err = validate();
  if (err) return alert(err);

  const item = {
    id: makeItemId(),
    name: nameInput.value.trim(),
    bin: binInput.value.trim(),
    zoneId: zoneSelect.value,
    qty: numOrZero(qtyInput.value),
    notes: notesInput.value || "",
    image: imageUrl || "",
  };

  await dbAddItem(item);
  openItem(item.id);
}

saveBtn?.addEventListener("click", save);
addForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  save();
});

async function init() {
  await ensureAuth();
  const zones = await dbGetZones();
  zoneSelect.innerHTML = zones
    .map(z => `<option value="${z.id}">${z.id} - ${z.name}</option>`)
    .join("");
  renderImage();
}

init();

