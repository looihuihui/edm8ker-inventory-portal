// js/search.js
// Purpose: Search items by name/bin/type and open item details.
// Note: When opening item details, we pass ?return= so the item page back button returns here.

import { dbSearchItems } from "./db.js";
import { setActiveNav } from "./app.js";

setActiveNav("search");

const backBtn = document.getElementById("backBtn");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsWrap = document.getElementById("resultsWrap");
const resultsList = document.getElementById("resultsList");

/* ---------------------------
   Navigation
---------------------------- */
backBtn?.addEventListener("click", () => {
  if (history.length > 1) history.back();
  else window.location.href = "index.html";
});

// Keep a return URL so Item Details -> Back returns to Search page.
function openItem(itemId) {
  const ret = encodeURIComponent(window.location.href);
  window.location.href = `item.html?id=${encodeURIComponent(itemId)}&return=${ret}`;
}

/* ---------------------------
   Rendering
---------------------------- */
function renderResults(items) {
  resultsList.innerHTML = "";

  if (!items.length) {
    resultsList.innerHTML = `<div class="empty-search">item not found</div>`;
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "row";

    const thumbHtml = item.image
      ? `<img src="${escapeHtml(item.image)}" alt="">`
      : "🖼️";

    row.innerHTML = `
      <div class="thumb">${thumbHtml}</div>
      <div style="flex:1;">
        <div class="name">${escapeHtml(item.name)}</div>
        <div class="meta">Type: ${escapeHtml(item.zoneId)} · Bin/Box: ${escapeHtml(item.bin)}</div>
      </div>
    `;

    row.addEventListener("click", () => openItem(item.id));
    resultsList.appendChild(row);
  });
}

/* ---------------------------
   Search logic
---------------------------- */
function doSearch() {
  const q = searchInput.value.trim();

  // On Search page, results container is always visible
  resultsWrap.style.display = "block";

  if (!q) {
    resultsList.innerHTML = `<div class="empty-search">type something to search</div>`;
    return;
  }

  const items = dbSearchItems(q);
  renderResults(items);
}

/* ---------------------------
   Events
---------------------------- */
searchInput?.addEventListener("input", doSearch);
searchBtn?.addEventListener("click", doSearch);

// Run once so the page isn't empty
doSearch();

/* ---------------------------
   Utils
---------------------------- */
function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
