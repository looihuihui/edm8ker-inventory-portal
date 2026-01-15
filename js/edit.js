// js/edit.js
// Purpose:
// - Edit an existing item (name, bin, zone, qty, notes, image)
// - Save / Cancel should NOT remain in browser history
// - Delete uses confirm modal

import { dbGetItem, dbGetZones, dbUpdateItem, dbDeleteItem } from "./db.js";
import { setActiveNav, getParam } from "./app.js";

setActiveNav("search");

/* --------------------------------------------------
   DOM refs
-------------------------------------------------- */
const cancelBtn = document.getElementById("cancelBtn");
const errorBox = document.getElementById("errorBox");
const editWrap = document.getElementById("editWrap");

const changeImgBtn = document.getElementById("changeImgBtn");
const photoPreview = document.getElementById("photoPreview");
const imageInput = document.getElementById("imageInput");

const editForm = document.getElementById("editForm");
const nameInput = document.getElementById("nameInput");
const binInput = document.getElementById("binInput");
const zoneSelect = document.getElementById("zoneSelect");
const qtyInput = document.getElementById("qtyInput");
const notesInput = document.getElementById("notesInput");

const deleteBtn = document.getElementById("deleteBtn");
const confirmModal = document.getElementById("confirmDeleteModal");
const confirmDelete = document.getElementById("confirmDelete");
const cancelDelete = document.getElementById("cancelDelete");

/* --------------------------------------------------
   State
-------------------------------------------------- */
const id = getParam("id");
let currentItem = null;
let imageUrl = "";

/* --------------------------------------------------
   UI helpers
-------------------------------------------------- */
function showError(msg) {
  errorBox.style.display = "block";
  errorBox.textContent = msg;
  editWrap.style.display = "none";
}

function showForm() {
  errorBox.style.display = "none";
  editWrap.style.display = "block";
}

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

  photoPreview.innerHTML = imageUrl
    ? `<img src="${imageUrl}" alt="">`
    : `<img src="assets/icons/image.png" alt="">`;
}

function populateZones(selected) {
  const zones = dbGetZones();
  zoneSelect.innerHTML = zones
    .map(
      z =>
        `<option value="${escapeHtml(z.id)}">
          ${escapeHtml(z.id)} - ${escapeHtml(z.name)}
        </option>`
    )
    .join("");

  if (selected) zoneSelect.value = selected;
}

/* --------------------------------------------------
   Validation + helpers
-------------------------------------------------- */
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

function retPart() {
  const ret = getParam("return");
  return ret ? `&return=${encodeURIComponent(ret)}` : "";
}

/* --------------------------------------------------
   Navigation rule (IMPORTANT)
   Edit page must NOT stay in history
-------------------------------------------------- */
function goItemDetailsReplace(itemId) {
  window.location.replace(
    `item.html?id=${encodeURIComponent(itemId)}${retPart()}`
  );
}

/* --------------------------------------------------
   Top actions
-------------------------------------------------- */
cancelBtn?.addEventListener("click", () => {
  if (!currentItem) {
    window.location.replace("index.html");
    return;
  }
  goItemDetailsReplace(currentItem.id);
});

/* --------------------------------------------------
   Form submit (Save)
-------------------------------------------------- */
editForm?.addEventListener("submit", e => {
  e.preventDefault();
  save();
});

/* --------------------------------------------------
   Delete modal
-------------------------------------------------- */
if (confirmModal) confirmModal.hidden = true;

deleteBtn?.addEventListener("click", () => {
  if (currentItem && confirmModal) confirmModal.hidden = false;
});

cancelDelete?.addEventListener("click", () => {
  if (confirmModal) confirmModal.hidden = true;
});

// tap backdrop to close
confirmModal?.addEventListener("click", e => {
  if (e.target === confirmModal) confirmModal.hidden = true;
});

confirmDelete?.addEventListener("click", () => {
  if (!currentItem) return;

  const ok = dbDeleteItem(currentItem.id);
  if (!ok) {
    alert("could not delete item 😭");
    return;
  }

  window.location.replace("index.html");
});

/* --------------------------------------------------
   Image upload
-------------------------------------------------- */
changeImgBtn?.addEventListener("click", () => imageInput?.click());

imageInput?.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = () => {
    imageUrl = String(reader.result || "");
    renderImage();
  };
  reader.readAsDataURL(file);
});

/* --------------------------------------------------
   Save logic
-------------------------------------------------- */
function save() {
  if (!currentItem) return;

  const err = validate();
  if (err) {
    alert(err);
    return;
  }

  const updated = dbUpdateItem(currentItem.id, {
    name: nameInput.value.trim(),
    bin: binInput.value.trim(),
    zoneId: zoneSelect.value,
    qty: numOrZero(qtyInput.value),
    notes: notesInput.value || "",
    image: imageUrl || "",
  });

  if (!updated) {
    alert("could not save item 😭");
    return;
  }

  goItemDetailsReplace(updated.id);
}

/* --------------------------------------------------
   Initial load
-------------------------------------------------- */
function load() {
  if (!id) {
    showError("no item selected 😅 go back and pick an item first.");
    return;
  }

  currentItem = dbGetItem(id);
  if (!currentItem) {
    showError("item not found 😭");
    return;
  }

  document.title = `Edit · ${currentItem.name}`;

  populateZones(currentItem.zoneId);
  nameInput.value = currentItem.name || "";
  binInput.value = currentItem.bin || "";
  qtyInput.value = String(currentItem.qty ?? 0);
  notesInput.value = currentItem.notes || "";

  imageUrl = currentItem.image || "";
  renderImage();

  showForm();
}

load();
