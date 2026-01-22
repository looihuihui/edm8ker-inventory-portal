// js/add.js
// Purpose: Add a new item (including optional image upload as base64 data URL).
// Navigation: After creating an item, we pass ?return= so Item Details -> Back returns here.

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
   Zones dropdown
-------------------------------------------------- */
function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function populateZones() {
  if (!zoneSelect) {
    console.error("❌ zoneSelect is null. Your HTML id is wrong or script runs too early.");
    alert("zoneSelect not found. Check HTML: id='zoneSelect'");
    return;
  }

  const zones = dbGetZones();
  console.log("zones:", zones);

  if (!Array.isArray(zones) || zones.length === 0) {
    console.error("❌ zones empty. dbGetZones() returned:", zones);
    zoneSelect.innerHTML = `<option value="">No zones found</option>`;
    alert("No zones found. dbGetZones() is empty.");
    return;
  }

  zoneSelect.innerHTML = zones
    .map(
      (z) =>
        `<option value="${escapeHtml(z.id)}">${escapeHtml(z.id)} - ${escapeHtml(z.name)}</option>`
    )
    .join("");

  console.log("✅ options count:", zoneSelect.options.length);
}


/* --------------------------------------------------
   Image upload (base64)
-------------------------------------------------- */
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

  // allow re-uploading the same file
  imgFileInput.value = "";
});

/* --------------------------------------------------
   Validation + save
-------------------------------------------------- */
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

function save() {
  const err = validate();
  if (err) {
    alert(err);
    return;
  }

  const item = dbAddItem({
    name: nameInput.value,
    bin: binInput.value,
    zoneId: zoneSelect.value,
    qty: numOrZero(qtyInput.value),
    notes: notesInput.value || "",
    image: imageUrl || "",
  });

  openItem(item.id);
}

/* --------------------------------------------------
   Events
-------------------------------------------------- */
saveBtn?.addEventListener("click", save);

addForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  save();
});

populateZones();
renderImage();
