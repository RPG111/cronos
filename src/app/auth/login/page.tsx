// src/app/auth/login/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  onAuthStateChanged,
} from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaReadyRef = useRef(false);

  // Si ya está logueado, manda a /home
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) router.replace("/home");
    });
    return () => unsub();
  }, [router]);

  // Inicializa reCAPTCHA invisible UNA sola vez
  useEffect(() => {
    if (recaptchaReadyRef.current) return;
    // Contenedor "virtual": el SDK lo maneja invisible
    try {
      // @ts-expect-error guardamos en window para que signIn lo reutilice si recargan
      if (!window.recaptchaVerifier) {
        // Nota: el primer arg ahora puede ser el objeto auth con el App Router
        // y un "container" que puede ser string id o undefined para invisible.
        // Usamos id real para evitar errores.
        const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
        // @ts-expect-error
        window.recaptchaVerifier = verifier;
      }
      recaptchaReadyRef.current = true;
    } catch (e) {
      console.error("Error creando reCAPTCHA", e);
    }
  }, []);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    // Validación simple del teléfono
    const raw = phone.trim();
    if (!raw.startsWith("+") || raw.length < 8) {
      alert("Escribe tu teléfono con + y lada, ej. +14155551234");
      return;
    }
    try {
      setSending(true);
      // @ts-expect-error
      const verifier: RecaptchaVerifier = window.recaptchaVerifier;
      if (!verifier) {
        alert("Captcha no listo. Recarga la página e inténtalo de nuevo.");
        return;
      }
      const conf = await signInWithPhoneNumber(auth, raw, verifier);
      confirmationRef.current = conf;
      setStep("otp");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "No se pudo enviar el código.");
      // Resetea el captcha si falló
      try {
        // @ts-expect-error
        window.recaptchaVerifier?.clear();
        // @ts-expect-error
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      } catch {}
    } finally {
      setSending(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.trim();
    if (!code) {
      alert("Escribe el código SMS.");
      return;
    }
    if (!confirmationRef.current) {
      alert("Vuelve a enviar el código.");
      setStep("form");
      return;
    }
    try {
      setVerifying(true);
      await confirmationRef.current.confirm(code);
      router.replace("/home");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Código incorrecto.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <main className="relative min-h-dvh w-full">
      {/* Fondo y degradado (como en login original) */}
      <img src="/images/stadium.jpg" alt="" className="absolute inset-0 h-full w-full object-cover blur-sm" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
      {/* Contenedor del captcha invisible */}
      <div id="recaptcha-container" className="absolute left-[-9999px] top-[-9999px]" />

      <div className="relative z-10 mx-auto grid min-h-dvh w-full max-w-xl place-items-center px-5">
        <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-md shadow-xl p-8 text-white">
          <h1 className="mb-2 text-center text-4xl font-extrabold text-emerald-400">Cronos</h1>
          <p className="mb-8 text-center text-white/80">Eventos deportivos en vivo cerca de ti</p>

          {step === "form" ? (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div>
                <span className="block text-xs tracking-widest text-white/70">TELÉFONO</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 415 555 1234"
                  className="mt-2 w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-white outline-none focus:border-emerald-500"
                />
                <p className="mt-1 text-[11px] text-white/60">Formato E.164 (ej. +15005550006)</p>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                {sending ? "Enviando…" : "Enviar código"}
              </button>

              <p className="text-center text-sm text-white/80">
                ¿No tienes cuenta? <a className="underline" href="/auth/register">Crea una</a>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <span className="block text-xs tracking-widest text-white/70">CÓDIGO SMS</span>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  inputMode="numeric"
                  placeholder="Ingresa el código de 6 dígitos"
                  className="mt-2 w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                {verifying ? "Verificando…" : "Entrar"}
              </button>

              <button
                type="button"
                onClick={() => setStep("form")}
                className="w-full rounded-xl border border-white/20 bg-black/40 py-3 font-semibold text-white hover:bg-black/50"
              >
                Cambiar teléfono
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
