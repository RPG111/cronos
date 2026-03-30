import { auth, db, ensureRecaptcha } from "./firebase";
import {
  signInWithPhoneNumber,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  ConfirmationResult,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

/** Persiste la sesión: local (recordar) o session (solo pestaña actual) */
export async function configurePersistence(remember = true) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
}

/** Enviar OTP al teléfono (E.164) */
export async function sendOTP(phoneE164: string): Promise<ConfirmationResult> {
  const verifier = ensureRecaptcha();
  if (!verifier) throw new Error("Recaptcha no inicializado");
  return await signInWithPhoneNumber(auth, phoneE164, verifier);
}

/** Guardar/actualizar perfil del usuario en Firestore */
export async function saveProfile(uid: string, data: { name?: string; phone: string; team?: string }) {
  await setDoc(
    doc(db, "users", uid),
    { ...data, updatedAt: serverTimestamp(), createdAt: serverTimestamp() },
    { merge: true }
  );
}
