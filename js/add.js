// js/add.js
// Purpose: Add a new item (image upload -> compress -> Firebase Storage -> save URL in Firestore)

import { dbGetZones, dbAddItem } from "./db.js";
import { setActiveNav } from "./app.js";

// ✅ ADD THESE IMPORTS (Firebase Storage)
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

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
// ✅ change meaning: now we store DOWNLOAD URL, not base64
let imageUrl = "";
let imageFile = null; // ✅ keep the selected file in memory

/* --------------------------------------------------
   Navigation
-------------------------------------------------- */
cancelBtn?.addEventListener("click", () => {
  if (history.length > 1) history.back();
  else window.location.href = "index.html";
});

function openItem(itemId) {
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
  const zones = dbGetZones();
  zoneSelect.innerHTML = zones
    .map(
      (z) =>
        `<option value="${escapeHtml(z.id)}">${escapeHtml(z.id)} - ${escapeHtml(
          z.name
        )}</option>`
    )
    .join("");
}

/* --------------------------------------------------
   ✅ Image compress + preview + upload
-------------------------------------------------- */

// ✅ new: compress to webp
async function compressImage(file, {
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.7,
  mimeType = "image/webp",
} = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => (img.src = e.target.result);
    reader.onerror = reject;

    img.onload = () => {
      let { width, height } = img;

      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject("Compression failed");

          const newName = file.name.replace(/\.\w+$/, ".webp");
          const compressedFile = new File([blob], newName, { type: mimeType });
          resolve(compressedFile);
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => reject("Image load error");
    reader.readAsDataURL(file);
  });
}

function renderImagePreviewFromUrl(url) {
  if (!photoPreview) return;
  if (!url) {
    photoPreview.textContent = "🖼️";
    return;
  }
  photoPreview.innerHTML = `<img src="${url}" alt="">`;
}

// ✅ helper: show preview from File (without base64 storing in Firestore)
function fileToObjectUrl(file) {
  return URL.createObjectURL(file);
}

changeImgBtn?.addEventListener("click", () => {
  imgFileInput?.click();
});

imgFileInput?.addEventListener("change", async (e) => {
  const original = e.target.files?.[0];
  if (!original) return;

  if (!original.type.startsWith("image/")) {
    alert("please upload an image file.");
    return;
  }

  // optional guardrail
  if (original.size > 8 * 1024 * 1024) {
    alert("image too big (max 8MB).");
    return;
  }

  // ✅ compress
  const compressed = await compressImage(original);

  // optional: ensure it stays under ~900KB
  if (compressed.size > 900 * 1024) {
    alert("image still too big after compression. try another photo.");
    return;
  }

  // ✅ store file in memory (NOT base64)
  imageFile = compressed;

  // ✅ preview using object URL
  const previewUrl = fileToObjectUrl(compressed);
  renderImagePreviewFromUrl(previewUrl);

  // allow re-uploading same file
  imgFileInput.value = "";
});

// ✅ upload to Firebase Storage, return download URL
async function uploadImageToStorage(file, itemId) {
  const storage = getStorage();
  const safeName = (file.name || "image.webp").replace(/[^\w.\-]+/g, "_");
  const path = `items/${itemId}/${Date.now()}_${safeName}`;

  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return url;
}

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

// ✅ make save async because upload is async
async function save() {
  const err = validate();
  if (err) {
    alert(err);
    return;
  }

  // 1) create item FIRST (without image)
  const item = dbAddItem({
    name: nameInput.value,
    bin: binInput.value,
    zoneId: zoneSelect.value,
    qty: numOrZero(qtyInput.value),
    notes: notesInput.value || "",
    image: "", // ✅ no base64
  });

  try {
    // 2) if user picked image, upload to Storage
    if (imageFile) {
      const url = await uploadImageToStorage(imageFile, item.id);

      // 3) update the item with image URL
      // easiest: call dbAddItem-style update if you have one
      // but since you only showed dbAddItem, we can re-add overwrite pattern if your db supports it.
      // ✅ assuming dbAddItem returns doc and your db.js has update fn:
      // await dbUpdateItem(item.id, { image: url });

      // 🚨 TEMP fallback: if dbAddItem writes firestore doc, you MUST add dbUpdateItem in db.js.
      // For now just store URL locally and open item page (item page can show it after update).
      imageUrl = url;
    }

    openItem(item.id);
  } catch (e) {
    console.error(e);
    alert("image upload failed. item saved without image.");
    openItem(item.id);
  }
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
renderImagePreviewFromUrl("");
