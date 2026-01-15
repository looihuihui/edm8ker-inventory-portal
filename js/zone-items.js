// js/zone-items.js
// Purpose: Show all items in one zone + allow quick filtering.
// Navigation:
// - zone-items.html?zone=A&return=... (return points back to zones.html)
// - when opening item details, pass return back to THIS page

import { dbGetZone, dbGetItemsByZone } from "./db.js";
import { setActiveNav, getParam } from "./app.js";

setActiveNav("zones");

/* --------------------------------------------------
   DOM refs
-------------------------------------------------- */
const backBtn = document.getElementById("backBtn");
const zoneTitle = document.getElementById("zoneTitle");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const itemsList = document.getElementById("itemsList");

/* --------------------------------------------------
   Params / state
-------------------------------------------------- */
const zoneId = getParam("zone") || "";
const returnTo = getParam("return"); // optional

let allItems = [];

/* --------------------------------------------------
   Navigation
-------------------------------------------------- */
backBtn?.addEventListener("click", () => {
  // Prefer explicit return= if provided (more predictable than history stack)
  if (returnTo) {
    window.location.href = decodeURIComponent(returnTo);
    return;
  }

  if (history.length > 1) history.back();
  else window.location.href = "zones.html";
});

function openItem(itemId) {
  // Return should bring user back to this zone list page
  const ret = encodeURIComponent(window.location.href);
  window.location.href = `item.html?id=${encodeURIComponent(itemId)}&return=${ret}`;
}

/* --------------------------------------------------
   Rendering
-------------------------------------------------- */
function renderEmpty(msg) {
  itemsList.innerHTML = `<div class="empty-state">${escapeHtml(msg)}</div>`;
}

function renderList(items) {
  itemsList.innerHTML = "";

  if (!zoneId) {
    renderEmpty("no zone selected 😅 go back and choose a zone.");
    return;
  }

  if (!items.length) {
    renderEmpty("no items found in this zone.");
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "item-row";

    const imgHtml = item.image
      ? `<img src="${escapeHtml(item.image)}" alt="">`
      : "🖼️";

    row.innerHTML = `
      <div class="item-left">${imgHtml}</div>
      <div class="item-main">
        <div class="item-name">${escapeHtml(item.name)}</div>
        <div class="item-meta">
          Type: ${escapeHtml(item.zoneId)}<br/>
          Bin/Box: ${escapeHtml(item.bin)}
        </div>
      </div>
    `;

    row.addEventListener("click", () => openItem(item.id));
    itemsList.appendChild(row);
  });
}

/* --------------------------------------------------
   Filtering
-------------------------------------------------- */
function matchesQuery(item, q) {
  const s = q.toLowerCase();
  return (
    (item.name || "").toLowerCase().includes(s) ||
    (item.bin || "").toLowerCase().includes(s) ||
    (item.zoneId || "").toLowerCase().includes(s)
  );
}

function doFilter() {
  const q = (searchInput?.value || "").trim();
  if (!q) {
    renderList(allItems);
    return;
  }

  const filtered = allItems.filter((it) => matchesQuery(it, q));
  renderList(filtered);
}

function initHeader() {
  if (!zoneId) {
    zoneTitle.textContent = "Unknown Zone";
    document.title = "Unknown Zone · Zone Items";
    return;
  }

  const zone = dbGetZone(zoneId);
  if (!zone) {
    zoneTitle.textContent = "Unknown Zone";
    document.title = "Unknown Zone · Zone Items";
    return;
  }

  zoneTitle.textContent = `${zone.id} - ${zone.name}`;
  document.title = `${zone.id} - ${zone.name} · Zone Items`;
}

function loadItems() {
  allItems = dbGetItemsByZone(zoneId);
  renderList(allItems);
}

searchInput?.addEventListener("input", doFilter);
searchBtn?.addEventListener("click", doFilter);

initHeader();
loadItems();

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
