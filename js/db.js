// js/db.js
// Data store for Edm8ker Inventory Portal.
// Storage: Browser localStorage under DB_KEY.
// Schema: { zones: [...], items: [...] }
//
// NOTE:
// - This is local-only storage. Different devices do NOT share the same data.
// - Item IDs are stable (ITEM-0001 etc.) and can be used in NFC URLs:
//   item.html?id=ITEM-0001

const DB_KEY = "edm8ker_inventory_v1";

function nowISO() {
  return new Date().toISOString();
}

// Initial demo data (first-time load only).
function seedData() {
  return {
    zones: [
      { id: "A", name: "Adhesives", img: "assets/zones/adhesives.png" },
      { id: "B", name: "Craft", img: "assets/zones/craft.png" },
      { id: "C", name: "Electrical", img: "assets/zones/electrical.png" },
      { id: "D", name: "Hardware", img: "assets/zones/hardware.png" },
      { id: "E", name: "Play Kit", img: "assets/zones/playkit.png" },
      { id: "F", name: "Cutter", img: "assets/zones/cutter.png" },
      { id: "G", name: "Activity Helpers", img: "assets/zones/activity.png" },
      { id: "H", name: "Paper Goods", img: "assets/zones/paper.png" },
      { id: "I", name: "Wooden Goods", img: "assets/zones/wooden.png" },
    ],
    items: [
      {
        id: "ITEM-0001",
        name: "Scotch Tape",
        zoneId: "A",
        bin: "A1A",
        qty: 100,
        notes: "1 quantity = 1 packet\n1 packet = 5 scotch tapes",
        image: "assets/items/scotch-tape.png",
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
      {
        id: "ITEM-0002",
        name: "Scotch Tape",
        zoneId: "A",
        bin: "A1B",
        qty: 60,
        notes: "",
        image: "assets/items/scotch-tape.png",
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
      {
        id: "ITEM-0003",
        name: "Elmer’s Glue",
        zoneId: "A",
        bin: "B1A",
        qty: 20,
        notes: "",
        image: "",
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
    ],
  };
}

/* --------------------------------------------------
   Core load/save
-------------------------------------------------- */
export function dbLoad() {
  const raw = localStorage.getItem(DB_KEY);

  // First-time: seed DB
  if (!raw) {
    const seeded = seedData();
    localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }

  // Normal load
  try {
    return JSON.parse(raw);
  } catch {
    // Corrupted JSON: re-seed
    const seeded = seedData();
    localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

export function dbSave(data) {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

/* --------------------------------------------------
   Zones
-------------------------------------------------- */
export function dbGetZones() {
  return dbLoad().zones;
}

export function dbGetZone(zoneId) {
  return dbLoad().zones.find((z) => z.id === zoneId) || null;
}

/* --------------------------------------------------
   Items
-------------------------------------------------- */
export function dbGetItems() {
  return dbLoad().items;
}

export function dbGetItemsByZone(zoneId) {
  return dbLoad().items.filter((i) => i.zoneId === zoneId);
}

export function dbSearchItems(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];

  const data = dbLoad();
  return data.items.filter((i) => {
    const name = (i.name || "").toLowerCase();
    const bin = (i.bin || "").toLowerCase();
    const zone = (i.zoneId || "").toLowerCase();

    return name.includes(q) || bin.includes(q) || zone.includes(q);
  });
}

export function dbGetItem(itemId) {
  return dbLoad().items.find((i) => i.id === itemId) || null;
}

/* --------------------------------------------------
   Mutations
-------------------------------------------------- */
// Generates next ID in ITEM-0004 style.
// Uses existing numeric max, then +1.
function newId(items) {
  const nums = items
    .map((i) => (i.id || "").match(/ITEM-(\d+)/))
    .filter(Boolean)
    .map((m) => parseInt(m[1], 10));

  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `ITEM-${String(next).padStart(4, "0")}`;
}

export function dbAddItem(payload) {
  const data = dbLoad();
  const id = newId(data.items);

  const item = {
    id,
    name: payload.name?.trim() || "",
    zoneId: payload.zoneId || "",
    bin: payload.bin?.trim() || "",
    qty: Number(payload.qty || 0),
    notes: payload.notes || "",
    image: payload.image || "", // can be asset path OR base64 data URL
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };

  data.items.unshift(item);
  dbSave(data);
  return item;
}

export function dbUpdateItem(itemId, patch) {
  const data = dbLoad();
  const idx = data.items.findIndex((i) => i.id === itemId);
  if (idx === -1) return null;

  data.items[idx] = {
    ...data.items[idx],
    ...patch,
    updatedAt: nowISO(),
  };

  dbSave(data);
  return data.items[idx];
}

export function dbAdjustQty(itemId, delta) {
  const item = dbGetItem(itemId);
  if (!item) return null;

  const nextQty = Math.max(0, Number(item.qty || 0) + Number(delta || 0));
  return dbUpdateItem(itemId, { qty: nextQty });
}

export function dbDeleteItem(itemId) {
  const data = dbLoad();
  const before = data.items.length;

  data.items = data.items.filter((i) => i.id !== itemId);

  dbSave(data);
  return data.items.length !== before; // true if deleted
}
