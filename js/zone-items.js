import { ensureAuth } from "./firebase.js";
import { dbGetZone, dbListenItemsByZone } from "./db.js";
import { setActiveNav, getParam } from "./app.js";

setActiveNav("zones");

const backBtn = document.getElementById("backBtn");
const zoneTitle = document.getElementById("zoneTitle");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const itemsList = document.getElementById("itemsList");

const zoneId = getParam("zone") || "";
const returnTo = getParam("return");

let allItems = [];
let unsub = null;

backBtn?.addEventListener("click", () => {
  if (returnTo) return (window.location.href = decodeURIComponent(returnTo));
  if (history.length > 1) history.back();
  else window.location.href = "zones.html";
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

function renderEmpty(msg) {
  itemsList.innerHTML = `<div class="empty-state">${escapeHtml(msg)}</div>`;
}

function renderList(items) {
  itemsList.innerHTML = "";
  if (!zoneId) return renderEmpty("no zone selected 😅 go back and choose a zone.");
  if (!items.length) return renderEmpty("no items found in this zone.");

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "item-row";

    row.innerHTML = `
      <div class="item-left">${item.image ? `<img src="${escapeHtml(item.image)}" alt="">` : "🖼️"}</div>
      <div class="item-main">
        <div class="item-name">${escapeHtml(item.name)}</div>
        <div class="item-meta">Type: ${escapeHtml(item.zoneId)}<br/>Bin/Box: ${escapeHtml(item.bin)}</div>
      </div>
    `;

    row.addEventListener("click", () => openItem(item.id));
    itemsList.appendChild(row);
  });
}

function doFilter() {
  const q = (searchInput.value || "").trim().toLowerCase();
  if (!q) return renderList(allItems);

  const filtered = allItems.filter(i =>
    (i.name || "").toLowerCase().includes(q) ||
    (i.bin || "").toLowerCase().includes(q) ||
    (i.zoneId || "").toLowerCase().includes(q)
  );
  renderList(filtered);
}

searchInput?.addEventListener("input", doFilter);
searchBtn?.addEventListener("click", doFilter);

async function init() {
  if (!zoneId) return renderEmpty("no zone selected 😅 go back and choose a zone.");

  await ensureAuth();

  const zone = await dbGetZone(zoneId);
  zoneTitle.textContent = zone ? `${zone.id} - ${zone.name}` : "Unknown Zone";
  document.title = zone ? `${zone.id} - ${zone.name} · Zone Items` : "Unknown Zone · Zone Items";

  // LIVE subscription
  unsub = dbListenItemsByZone(zoneId, (items) => {
    allItems = items;
    doFilter();
  });
}

init();
window.addEventListener("beforeunload", () => unsub?.());
