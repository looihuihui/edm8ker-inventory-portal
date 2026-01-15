// js/zones.js
// Purpose: Display all zones and route into zone item lists.
// Navigation: Pass ?return= so back buttons work predictably.

import { dbGetZones } from "./db.js";
import { setActiveNav } from "./app.js";

setActiveNav("zones");

/* --------------------------------------------------
   DOM refs
-------------------------------------------------- */
const backBtn = document.getElementById("backBtn");
const zonesGrid = document.getElementById("zonesGrid");

/* --------------------------------------------------
   Back navigation
-------------------------------------------------- */
backBtn?.addEventListener("click", () => {
  if (history.length > 1) history.back();
  else window.location.href = "index.html";
});

/* --------------------------------------------------
   Helpers
-------------------------------------------------- */
function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openZone(zoneId) {
  // store current page so Zone Items → Back returns here
  const ret = encodeURIComponent(window.location.href);
  window.location.href = `zone-items.html?zone=${encodeURIComponent(zoneId)}&return=${ret}`;
}

/* --------------------------------------------------
   Render
-------------------------------------------------- */
function renderZones() {
  const zones = dbGetZones();
  zonesGrid.innerHTML = "";

  zones.forEach((z) => {
    const card = document.createElement("div");
    card.className = "zone-card";

    // special line break for long label
    const labelName =
      z.name === "Paper Goods"
        ? "Paper<br>Goods"
        : escapeHtml(z.name);

    card.innerHTML = `
      <div class="zone-img">
        ${z.img
          ? `<img src="${escapeHtml(z.img)}" alt="${escapeHtml(z.name)}">`
          : `<div style="font-size:28px;">📦</div>`
        }
      </div>
      <div class="zone-label">
        ${escapeHtml(z.id)} - ${labelName}
      </div>
    `;

    card.addEventListener("click", () => openZone(z.id));
    zonesGrid.appendChild(card);
  });
}

/* --------------------------------------------------
   Init
-------------------------------------------------- */
renderZones();
