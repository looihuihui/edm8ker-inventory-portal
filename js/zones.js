import { ensureAuth } from "./firebase.js";
import { dbGetZones } from "./db.js";
import { setActiveNav } from "./app.js";

setActiveNav("zones");

const backBtn = document.getElementById("backBtn");
const zonesGrid = document.getElementById("zonesGrid");

backBtn?.addEventListener("click", () => {
  if (history.length > 1) history.back();
  else window.location.href = "index.html";
});

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openZone(zoneId) {
  const ret = encodeURIComponent(window.location.href);
  window.location.href = `zone-items.html?zone=${encodeURIComponent(zoneId)}&return=${ret}`;
}

async function init() {
  await ensureAuth();

  const zones = await dbGetZones();
  zonesGrid.innerHTML = "";

  zones.forEach((z) => {
    const card = document.createElement("div");
    card.className = "zone-card";

    const labelName = z.name === "Paper Goods" ? "Paper<br>Goods" : escapeHtml(z.name);

    card.innerHTML = `
      <div class="zone-img">
        ${z.img ? `<img src="${escapeHtml(z.img)}" alt="${escapeHtml(z.name)}">` : `<div style="font-size:28px;">📦</div>`}
      </div>
      <div class="zone-label">${escapeHtml(z.id)} - ${labelName}</div>
    `;

    card.addEventListener("click", () => openZone(z.id));
    zonesGrid.appendChild(card);
  });
}

init();
