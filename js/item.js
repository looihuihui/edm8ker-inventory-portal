// js/item.js (Firestore live)
import { ensureAuth } from "./firebase.js";
import { dbListenItem, dbAdjustQty } from "./db.js";
import { setActiveNav, getParam } from "./app.js";

setActiveNav("search");

const CATEGORY_MAP = {
  A: "Adhesives", B: "Craft", C: "Electrical", D: "Hardware",
  E: "Play Kit", F: "Cutter", G: "Activity Helpers", H: "Paper Goods", I: "Wooden Goods",
};

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

const id = getParam("id");
const returnTo = getParam("return");

let currentItem = null;
let unsub = null;

backBtn?.addEventListener("click", () => {
  if (returnTo) {
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
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function numOrZero(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function render(item) {
  document.title = `${item.name} · Item`;
  itemName.textContent = item.name || "-";
  itemBin.textContent = `Bin/Box: ${item.bin || "-"}`;

  const code = String(item.zoneId || "-").trim();
  const label = CATEGORY_MAP[code] || "";
  itemType.textContent = label ? `Type: ${code} - ${label}` : `Type: ${code}`;

  qtyNum.textContent = String(item.qty ?? 0);
  notesArea.value = item.notes || "";

  if (item.image) itemPhoto.innerHTML = `<img src="${escapeHtml(item.image)}" alt="">`;
  else itemPhoto.textContent = "🖼️";

  showItem();
}

inBtn?.addEventListener("click", async () => {
  if (!currentItem) return;
  const amt = numOrZero(inInput.value);
  if (!amt) return;

  await dbAdjustQty(currentItem.id, +amt);
  inInput.value = "0";
});

outBtn?.addEventListener("click", async () => {
  if (!currentItem) return;
  const amt = numOrZero(outInput.value);
  if (!amt) return;

  await dbAdjustQty(currentItem.id, -amt);
  outInput.value = "0";
});

async function init() {
  if (!id) {
    showError("no item selected 😅");
    return;
  }

  await ensureAuth();

  // LIVE subscription: phone and laptop sync instantly
  unsub = dbListenItem(id, (item) => {
    if (!item) {
      showError("item not found 😭");
      currentItem = null;
      return;
    }
    currentItem = item;
    render(item);
  });
}

init();

// cleanup (optional)
window.addEventListener("beforeunload", () => unsub?.());
