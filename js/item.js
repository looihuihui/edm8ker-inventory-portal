// js/item.js
// Purpose: Item details page (view info, adjust quantity, jump to edit).
// Navigation contract:
// - Open via: item.html?id=ITEM-0001&return=<encoded-url>
// - Back button prefers return= if provided.
// - Edit page must receive the same return= so Save/Cancel keeps users going back to selection page.

import { dbGetItem, dbAdjustQty } from "./db.js";
import { setActiveNav, getParam } from "./app.js";

setActiveNav("search");

/* --------------------------------------------------
   Category label map (display only)
-------------------------------------------------- */
const CATEGORY_MAP = {
  A: "Adhesives",
  B: "Craft",
  C: "Electrical",
  D: "Hardware",
  E: "Play Kit",
  F: "Cutter",
  G: "Activity Helpers",
  H: "Paper Goods",
  I: "Wooden Goods",
};

/* --------------------------------------------------
   DOM refs
-------------------------------------------------- */
const backBtn = document.getElementById("backBtn");
const editBtn = document.getElementById("editBtn");

const errorBox = document.getElementById("errorBox");
const itemWrap = document.getElementById("itemWrap");

const itemPhoto = document.getElementById("itemPhoto");
const itemName = document.getElementById("itemName");
const itemBin = document.getElementById("itemBin");
const itemType = document.getElementById("itemType");
const qtyNum = document.getElementById("qtyNum");
const notesArea = document.getElementById("notesArea");

const inInput = document.getElementById("inInput");
const outInput = document.getElementById("outInput");
const inBtn = document.getElementById("inBtn");
const outBtn = document.getElementById("outBtn");

/* --------------------------------------------------
   Params / state
-------------------------------------------------- */
const id = getParam("id");
const returnTo = getParam("return"); // optional

let currentItem = null;

/* --------------------------------------------------
   Navigation
-------------------------------------------------- */
backBtn?.addEventListener("click", () => {
  if (returnTo) {
    // return= is already encoded once by previous page
    window.location.href = decodeURIComponent(returnTo);
    return;
  }

  if (history.length > 1) history.back();
  else window.location.href = "index.html";
});

editBtn?.addEventListener("click", () => {
  if (!currentItem) return;

  const ret = getParam("return");
  const retPart = ret ? `&return=${encodeURIComponent(ret)}` : "";

  window.location.href = `edit.html?id=${encodeURIComponent(currentItem.id)}${retPart}`;
});

/* --------------------------------------------------
   UI helpers
-------------------------------------------------- */
function showError(msg) {
  errorBox.style.display = "block";
  errorBox.textContent = msg;
  itemWrap.style.display = "none";
}

function showItem() {
  errorBox.style.display = "none";
  itemWrap.style.display = "block";
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function numOrZero(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

/* --------------------------------------------------
   Render / Load
-------------------------------------------------- */
function loadItem() {
  currentItem = id ? dbGetItem(id) : null;

  if (!currentItem) {
    showError("item not found 😭 try going back and searching again.");
    return;
  }

  document.title = `${currentItem.name} · Item`;

  itemName.textContent = currentItem.name || "-";
  itemBin.textContent = `Bin/Box: ${currentItem.bin || "-"}`;

  const code = String(currentItem.zoneId || "-").trim();
  const label = CATEGORY_MAP[code] || "";
  itemType.textContent = label ? `Type: ${code} - ${label}` : `Type: ${code}`;

  qtyNum.textContent = String(currentItem.qty ?? 0);
  notesArea.value = currentItem.notes || "";

  if (currentItem.image) {
    itemPhoto.innerHTML = `<img src="${escapeHtml(currentItem.image)}" alt="">`;
  } else {
    itemPhoto.textContent = "🖼️";
  }

  showItem();
}

function refreshQty() {
  const fresh = dbGetItem(currentItem.id);
  if (!fresh) return;

  currentItem = fresh;
  qtyNum.textContent = String(currentItem.qty ?? 0);
}

/* --------------------------------------------------
   Quantity adjust
-------------------------------------------------- */
inBtn?.addEventListener("click", () => {
  if (!currentItem) return;

  const amt = numOrZero(inInput.value);
  if (!amt) return;

  dbAdjustQty(currentItem.id, +amt);
  inInput.value = "0";
  refreshQty();
});

outBtn?.addEventListener("click", () => {
  if (!currentItem) return;

  const amt = numOrZero(outInput.value);
  if (!amt) return;

  dbAdjustQty(currentItem.id, -amt);
  outInput.value = "0";
  refreshQty();
});

loadItem();
