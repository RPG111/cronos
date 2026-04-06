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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "10px",
  letterSpacing: "2px",
  color: "#8899bb",
  fontWeight: 700,
  textTransform: "uppercase",
  marginBottom: "6px",
};

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
    try {
      // @ts-expect-error
      if (!window.recaptchaVerifier) {
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
    <main style={{
      position: "relative",
      minHeight: "100dvh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#080c14",
    }}>
      {/* Fondo */}
      <img
        src="/images/stadium.jpg"
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "blur(4px)",
        }}
      />
      <div style={{
        position: "absolute",
        inset: 0,
        background: "rgba(8, 12, 20, 0.85)",
      }} />

      {/* Captcha invisible */}
      <div id="recaptcha-container" className="absolute left-[-9999px] top-[-9999px]" />

      {/* Card */}
      <div style={{
        position: "relative",
        zIndex: 10,
        background: "#0a1220",
        border: "1px solid #142035",
        borderRadius: "24px",
        padding: "32px 28px",
        maxWidth: "420px",
        width: "92%",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          <span className="logo-cronos select-none" style={{ fontSize: "32px" }} />
        </div>

        {/* Subtítulo */}
        <p style={{
          textAlign: "center",
          color: "#8899bb",
          fontSize: "12px",
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginBottom: "28px",
        }}>
          eventos deportivos · bay area
        </p>

        {step === "form" ? (
          <form onSubmit={handleSendCode} style={{ display: "grid", gap: "18px" }}>
            <div>
              <label style={labelStyle}>teléfono</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 415 555 1234"
                className="input-cronos"
                style={{ width: "100%" }}
              />
              <p style={{ fontSize: "11px", color: "#3a5070", marginTop: "4px" }}>
                formato +1 415 555 1234
              </p>
            </div>

            <button
              type="submit"
              disabled={sending}
              style={{ width: "100%", padding: "14px", borderRadius: "24px", background: "linear-gradient(135deg, #ff6b00, #ff8c00)", color: "#fff", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer", opacity: sending ? 0.7 : 1 }}
            >
              {sending ? "Enviando…" : "enviar código"}
            </button>

            <p style={{ textAlign: "center", fontSize: "13px", color: "#8a9ab0" }}>
              ¿no tienes cuenta?{" "}
              <a href="/auth/register" style={{ color: "#ff8c00", textDecoration: "none" }}>
                créala
              </a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} style={{ display: "grid", gap: "18px" }}>
            <div>
              <label style={labelStyle}>código sms</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputMode="numeric"
                placeholder="Ingresa el código de 6 dígitos"
                className="input-cronos"
                style={{ width: "100%" }}
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              style={{ width: "100%", padding: "14px", borderRadius: "24px", background: "linear-gradient(135deg, #ff6b00, #ff8c00)", color: "#fff", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer", opacity: verifying ? 0.7 : 1 }}
            >
              {verifying ? "Verificando…" : "entrar"}
            </button>

            <button
              type="button"
              onClick={() => setStep("form")}
              style={{ width: "100%", padding: "14px", borderRadius: "24px", background: "rgba(192,192,192,0.05)", border: "1px solid rgba(192,192,192,0.2)", color: "#e8f0ff", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}
            >
              cambiar teléfono
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
