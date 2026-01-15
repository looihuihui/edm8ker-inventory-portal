import { ensureAuth } from "./firebase.js";
import { dbSearchItems } from "./db.js";
import { setActiveNav } from "./app.js";

setActiveNav("search");

const backBtn = document.getElementById("backBtn");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsWrap = document.getElementById("resultsWrap");
const resultsList = document.getElementById("resultsList");

backBtn?.addEventListener("click", () => {
  if (history.length > 1) history.back();
  else window.location.href = "index.html";
});

function openItem(itemId) {
  const ret = encodeURIComponent(window.location.href);
  window.location.href = `item.html?id=${encodeURIComponent(itemId)}&return=${ret}`;
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderResults(items) {
  resultsList.innerHTML = "";

  if (!items.length) {
    resultsList.innerHTML = `<div class="empty-search">item not found</div>`;
    return;
  }

  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <div class="thumb">${item.image ? `<img src="${escapeHtml(item.image)}" alt="">` : "🖼️"}</div>
      <div style="flex:1;">
        <div class="name">${escapeHtml(item.name)}</div>
        <div class="meta">Type: ${escapeHtml(item.zoneId)} · Bin/Box: ${escapeHtml(item.bin)}</div>
      </div>
    `;
    row.addEventListener("click", () => openItem(item.id));
    resultsList.appendChild(row);
  });
}

async function doSearch() {
  const q = searchInput.value.trim();
  resultsWrap.style.display = "block";

  if (!q) {
    resultsList.innerHTML = `<div class="empty-search">type something to search</div>`;
    return;
  }

  const items = await dbSearchItems(q);
  renderResults(items);
}

searchInput?.addEventListener("input", doSearch);
searchBtn?.addEventListener("click", doSearch);

async function init() {
  await ensureAuth();
  doSearch();
}
init();
