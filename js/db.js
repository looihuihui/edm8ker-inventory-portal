// js/db.js (Firestore LIVE version)

import { db } from "./firebase.js";
import {
  doc, collection,
  setDoc, updateDoc, deleteDoc, serverTimestamp,
  getDoc, getDocs, query, where,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* -----------------------------
   Zones
----------------------------- */
export async function dbGetZones() {
  const snap = await getDocs(collection(db, "zones"));
  return snap.docs.map(d => ({
    ...d.data(),     // keeps your existing {id:"A", name:"...", img:"..."}
    docId: d.id      // extra field in case you need it later
  }));
}

export async function dbGetZone(zoneId) {
  const snap = await getDoc(doc(db, "zones", zoneId));
  return snap.exists()
    ? ({ ...snap.data(), docId: snap.id })
    : null;
}
/* -----------------------------
   Items
----------------------------- */
export async function dbGetItem(itemId) {
  const snap = await getDoc(doc(db, "items", itemId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() }) : null;
}

export async function dbGetItemsByZone(zoneId) {
  const q = query(collection(db, "items"), where("zoneId", "==", zoneId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// MVP search: fetch all items then filter client-side.
export async function dbSearchItems(queryStr) {
  const qStrLower = (queryStr || "").trim().toLowerCase();
  if (!qStrLower) return [];

  const snap = await getDocs(collection(db, "items"));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(i =>
      (i.name || "").toLowerCase().includes(qStrLower) ||
      (i.bin || "").toLowerCase().includes(qStrLower) ||
      (i.zoneId || "").toLowerCase().includes(qStrLower)
    );
}

export async function dbAddItem(item) {
  // create random id
  const ref = doc(collection(db, "items"));

  await setDoc(ref, {
    ...item,
    id: ref.id, // store id in doc too (optional but convenient)
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { ...item, id: ref.id };
}

export async function dbUpdateItem(itemId, patch) {
  await updateDoc(doc(db, "items", itemId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
  return await dbGetItem(itemId);
}

export async function dbAdjustQty(itemId, delta) {
  const item = await dbGetItem(itemId);
  if (!item) return null;

  const nextQty = Math.max(0, Number(item.qty || 0) + Number(delta || 0));
  await updateDoc(doc(db, "items", itemId), {
    qty: nextQty,
    updatedAt: serverTimestamp(),
  });

  return nextQty;
}

export async function dbDeleteItem(itemId) {
  await deleteDoc(doc(db, "items", itemId));
  return true;
}

/* -----------------------------
   LIVE listeners
----------------------------- */
export function dbListenItem(itemId, cb) {
  return onSnapshot(doc(db, "items", itemId), (snap) => {
    cb(snap.exists() ? ({ id: snap.id, ...snap.data() }) : null);
  });
}

export function dbListenItemsByZone(zoneId, cb) {
  const q = query(collection(db, "items"), where("zoneId", "==", zoneId));
  return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

