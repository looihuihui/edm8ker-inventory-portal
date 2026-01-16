// js/edit.js (Firestore live-ready)
import { ensureAuth } from "./firebase.js";
import { dbGetItem, dbGetZones, dbUpdateItem, dbDeleteItem } from "./db.js";
import { setActiveNav, getParam } from "./app.js";

setActiveNav("search");

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

const id = getParam("id");
let currentItem = null;
let imageUrl = "";

/* -------------------- UI helpers -------------------- */
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
  if (!imageUrl) {
    photoPreview.innerHTML = `<img src="assets/icons/image.png" alt="">`;
    return;
  }
  photoPreview.innerHTML = `<img src="${imageUrl}" alt="">`;
}
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
function goItemDetailsReplace(itemId) {
  // IMPORTANT: remove Edit from history so Back from Item goes to selection page
  window.location.replace(`item.html?id=${encodeURIComponent(itemId)}${retPart()}`);
}

/* -------------------- Events -------------------- */
cancelBtn?.addEventListener("click", () => {
  window.location.replace("index.html");
});


editForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  save();
});

// Modal open/close
if (confirmModal) confirmModal.hidden = true;

deleteBtn?.addEventListener("click", () => {
  if (!currentItem || !confirmModal) return;
  confirmModal.hidden = false;
});
cancelDelete?.addEventListener("click", () => {
  if (confirmModal) confirmModal.hidden = true;
});
confirmModal?.addEventListener("click", (e) => {
  if (e.target === confirmModal) confirmModal.hidden = true;
});

confirmDelete?.addEventListener("click", async () => {
  if (!currentItem) return;
  await dbDeleteItem(currentItem.id);
  window.location.replace("index.html");
});

// Image upload
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

/* -------------------- Save -------------------- */
async function save() {
  if (!currentItem) return;

  const err = validate();
  if (err) return alert(err);

  const updated = await dbUpdateItem(currentItem.id, {
    name: nameInput.value.trim(),
    bin: binInput.value.trim(),
    zoneId: zoneSelect.value,
    qty: numOrZero(qtyInput.value),
    notes: notesInput.value || "",
    image: imageUrl || "",
  });

  if (!updated) return alert("could not save item 😭");
  goItemDetailsReplace(updated.id);
}

/* -------------------- Init -------------------- */
async function init() {
  if (!id) return showError("no item selected 😅 go back and pick an item first.");

  await ensureAuth();

  // zones
  const zones = await dbGetZones();
  zoneSelect.innerHTML = zones
    .map(z => `<option value="${escapeHtml(z.id)}">${escapeHtml(z.id)} - ${escapeHtml(z.name)}</option>`)
    .join("");

  // item
  currentItem = await dbGetItem(id);
  if (!currentItem) return showError("item not found 😭");

  document.title = `Edit · ${currentItem.name}`;
  zoneSelect.value = currentItem.zoneId || "";

  nameInput.value = currentItem.name || "";
  binInput.value = currentItem.bin || "";
  qtyInput.value = String(currentItem.qty ?? 0);
  notesInput.value = currentItem.notes || "";

  imageUrl = currentItem.image || "";
  renderImage();

  showForm();
}

init();

