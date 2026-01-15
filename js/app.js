// js/app.js
// Shared helpers used across pages.
// Keep this file small + stable because many pages import it.

const USER_KEY = "edm8ker_inventory_user_v1";

/* --------------------------------------------------
   URL helpers
-------------------------------------------------- */
export function getParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

/* --------------------------------------------------
   Navigation (bottom nav highlight)
   Note: data-nav values must match the string passed in.
-------------------------------------------------- */
export function setActiveNav(active) {
  const ids = ["nav-home", "nav-search", "nav-zones", "nav-add"];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.classList.toggle("active", el.dataset.nav === active);
  });
}

/* --------------------------------------------------
   Simple routing helper (optional)
-------------------------------------------------- */
export function routeTo(path) {
  window.location.href = path;
}

/* --------------------------------------------------
   User name (optional audit field)
   Stored locally per device.
-------------------------------------------------- */
export function getUserName() {
  return (localStorage.getItem(USER_KEY) || "").trim();
}

export function setUserName(name) {
  localStorage.setItem(USER_KEY, (name || "").trim());
}

// Used only if you want to prompt for a name before logging actions.
export function requireUserName() {
  let name = getUserName();
  if (name) return name;

  name = (prompt("enter your name (for audit log):", "") || "").trim();
  if (!name) name = "Unknown";

  setUserName(name);
  return name;
}
