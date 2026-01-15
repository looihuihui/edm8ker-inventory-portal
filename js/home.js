// js/home.js (Firestore live)
import { ensureAuth } from "./firebase.js";
import { dbSearchItems } from "./db.js";
import { setActiveNav, routeTo } from "./app.js";

setActiveNav("home");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsWrap = document.getElementById("resultsWrap");
const resultsList = document.getElementById("resultsList");

const browseZonesBtn = document.getElementById("browseZonesBtn");
const addItemBtn = document.getElementById("addItemBtn");

browseZonesBtn?.addEventListener("click", () => routeTo("zones.html"));
addItemBtn?.addEventListener("click", () => routeTo("add.html"));

/* ------------------ helpers ------------------ */
function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openItem(itemId) {
  const ret = encodeURIComponent(window.location.href);
  window.location.href = `item.html?id=${encodeURIComponent(itemId)}&return=${ret}`;
}

/* ------------------ render ------------------ */
function renderResults(items) {
  resultsList.innerHTML = "";

  if (!items.length) {
    resultsList.innerHTML = `
      <div class="empty-search">
        item not found
      </div>
    `;
    return;
  }

  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <div class="thumb">
        ${item.image ? `<img src="${escapeHtml(item.image)}" alt="">` : "🖼️"}
      </div>
      <div style="flex:1;">
        <div class="name">${escapeHtml(item.name)}</div>
        <div class="meta">
          Type: ${escapeHtml(item.zoneId)} · Bin/Box: ${escapeHtml(item.bin)}
        </div>
      </div>
    `;
    row.addEventListener("click", () => openItem(item.id));
    resultsList.appendChild(row);
  });
}

/* ------------------ search ------------------ */
async function doSearch() {
  const q = searchInput.value.trim();

  // close popup if empty
  if (!q) {
    resultsWrap.classList.remove("show");
    return;
  }

  resultsWrap.classList.add("show");

  const items = await dbSearchItems(q);
  renderResults(items);
}

searchInput?.addEventListener("input", doSearch);
searchBtn?.addEventListener("click", doSearch);

/* ------------------ init ------------------ */
async function init() {
  await ensureAuth();
}

init();
