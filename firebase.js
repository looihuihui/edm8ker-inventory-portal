// js/firebase.js
// Firebase setup for static hosting (GitHub Pages / Vercel).
// Uses Firebase modular SDK via CDN imports.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBLOV8lUbpjzrUziJapZctCdN8sNi40ynE",
  authDomain: "edm8ker-inventory.firebaseapp.com",
  projectId: "edm8ker-inventory",
  storageBucket: "edm8ker-inventory.firebasestorage.app",
  messagingSenderId: "464408247170",
  appId: "1:464408247170:web:41cb6a89c204a07d6b2d9b",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

// Ensure user is signed in (anonymous) so Firestore rules can require auth.
export async function ensureAuth() {
  if (auth.currentUser) return auth.currentUser;
  const res = await signInAnonymously(auth);
  return res.user;
}
