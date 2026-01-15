// js/home.js
// Purpose: Home page quick search popup + quick action buttons.
// Note: When opening item details, we pass ?return= so the item back button returns here.

import { dbSearchItems } from "./db.js";
import { setActiveNav, routeTo } from "./app.js";

setActiveNav("home");

/* --------------------------------------------------
   DOM refs
-------------------------------------------------- */
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsWrap = document.getElementById("resultsWrap");
const resultsList = document.getElementById("resultsList");

const browseZonesBtn = document.getElementById("browseZonesBtn");
const addItemBtn = document.getElementById("addItemBtn");

/* --------------------------------------------------
   Navigation
-------------------------------------------------- */
browseZonesBtn?.addEventListener("click", () => routeTo("zones.html"));
addItemBtn?.addEventListener("click", () => routeTo("add.html"));

function openItem(itemId) {
  const ret = encodeURIComponent(window.location.href);
  window.location.href = `item.html?id=${encodeURIComponent(itemId)}&return=${ret}`;
}

/* --------------------------------------------------
   Rendering
-------------------------------------------------- */
function renderEmpty(msg) {
  resultsList.innerHTML = `<div class="empty-search">${escapeHtml(msg)}</div>`;
}

function renderResults(items) {
  resultsList.innerHTML = "";

  if (!items.length) {
    renderEmpty("item not found");
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

/* --------------------------------------------------
   Search logic (popup)
-------------------------------------------------- */
function doSearch() {
  const q = (searchInput?.value || "").trim();

  // If empty, hide popup
  if (!q) {
    resultsWrap?.classList.remove("show");
    resultsList.innerHTML = "";
    return;
  }

  // Always show popup while searching
  resultsWrap?.classList.add("show");

  const items = dbSearchItems(q);
  renderResults(items);
}

/* --------------------------------------------------
   Events
-------------------------------------------------- */
searchInput?.addEventListener("input", doSearch);
searchBtn?.addEventListener("click", doSearch);

/* --------------------------------------------------
   Utils (avoid HTML injection)
-------------------------------------------------- */
function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
