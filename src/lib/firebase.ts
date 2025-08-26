// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// ⚙️ Config desde variables de entorno (Vercel / .env.local)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// 🧩 App única (evita inicializar 2 veces)
const app: FirebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

// 🔐 Auth y 🔥 Firestore
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

/**
 * ✅ ensureRecaptcha
 * Crea (una sola vez) el RecaptchaVerifier para login por teléfono.
 * - Por default usa contenedor "recaptcha-container" e invisible.
 * - Si el contenedor no existe, lo crea oculto.
 * - En servidor no hace nada (devuelve null).
 */
function ensureRecaptcha(
  containerId: string = "recaptcha-container",
  size: "invisible" | "normal" = "invisible"
) {
  if (typeof window === "undefined") return null;

  const w = window as any;
  if (w._cronosRecaptcha) return w._cronosRecaptcha;

  // Garantiza que exista el contenedor
  let el = document.getElementById(containerId);
  if (!el) {
    el = document.createElement("div");
    el.id = containerId;
    el.style.display = "none";
    document.body.appendChild(el);
  }

  // Crea y cachea el verifier
  const verifier = new RecaptchaVerifier(auth, containerId, { size });
  w._cronosRecaptcha = verifier;
  return verifier;
}

export { app, auth, db, ensureRecaptcha };
