// js/add.js (Firestore live-ready)
// Purpose: Add a new item (optional image base64 for now)
// Navigation: After creating an item, we pass ?return= so Item Details -> Back returns here.

import { ensureAuth } from "./firebase.js";
import { dbGetZones, dbAddItem } from "./db.js";
import { setActiveNav } from "./app.js";

setActiveNav("add");

/* --------------------------------------------------
   DOM refs
-------------------------------------------------- */
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

/* --------------------------------------------------
   State
-------------------------------------------------- */
let imageUrl = "";

/* --------------------------------------------------
   Navigation
-------------------------------------------------- */
cancelBtn?.addEventListener("click", () => {
  if (history.length > 1) history.back();
  else window.location.href = "index.html";
});

function openItem(itemId) {
  // Return should bring user back to Add page
  const ret = encodeURIComponent(window.location.href);
  window.location.href = `item.html?id=${encodeURIComponent(itemId)}&return=${ret}`;
}

/* --------------------------------------------------
   Helpers
-------------------------------------------------- */
function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderImage() {
  if (!photoPreview) return;

  if (!imageUrl) {
    photoPreview.textContent = "🖼️";
    return;
  }

  photoPreview.innerHTML = `<img src="${imageUrl}" alt="">`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function numOrZero(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function validate() {
  const name = (nameInput?.value || "").trim();
  const bin = (binInput?.value || "").trim();
  const zoneId = zoneSelect?.value || "";

  if (!name) return "item name is required.";
  if (!bin) return "bin number is required.";
  if (!zoneId) return "category type is required.";
  return "";
}

/* --------------------------------------------------
   Image upload (base64)
-------------------------------------------------- */
changeImgBtn?.addEventListener("click", () => {
  imgFileInput?.click();
});

imgFileInput?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("please upload an image file.");
    return;
  }

  imageUrl = await fileToDataUrl(file);
  renderImage();

  // allow re-uploading same file
  imgFileInput.value = "";
});

/* --------------------------------------------------
   Save
-------------------------------------------------- */
async function save() {
  const err = validate();
  if (err) return alert(err);

  const item = await dbAddItem({
    name: nameInput.value.trim(),
    bin: binInput.value.trim(),
    zoneId: zoneSelect.value,
    qty: numOrZero(qtyInput.value),
    notes: notesInput.value || "",
    image: imageUrl || "",
  });

  if (!item) return alert("could not add item 😭");
  openItem(item.id);
}

/* --------------------------------------------------
   Events
-------------------------------------------------- */
saveBtn?.addEventListener("click", () => save());

addForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  save();
});

/* --------------------------------------------------
   Init (same style as edit.js)
-------------------------------------------------- */
async function init() {
  await ensureAuth();

  const zones = await dbGetZones();
  zoneSelect.innerHTML = zones
    .map(
      (z) =>
        `<option value="${escapeHtml(z.id)}">${escapeHtml(z.id)} - ${escapeHtml(
          z.name
        )}</option>`
    )
    .join("");

  renderImage();
}

init();
