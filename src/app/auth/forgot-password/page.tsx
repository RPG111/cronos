// src/app/auth/forgot-password/page.tsx
"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "10px",
  letterSpacing: "2px",
  color: "#8a7a50",
  fontWeight: 700,
  textTransform: "uppercase",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#150e1e",
  border: "1px solid #2a2010",
  borderRadius: "12px",
  padding: "12px 14px",
  color: "#c8d8f0",
  outline: "none",
  fontSize: "14px",
  boxSizing: "border-box",
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim()) { setErrorMsg("El email es obligatorio."); return; }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        setErrorMsg("No existe una cuenta con este email.");
      } else if (code === "auth/invalid-email") {
        setErrorMsg("Email inválido.");
      } else {
        setErrorMsg("Error al enviar el email. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
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
      background: "#09080f",
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
      <div style={{ position: "absolute", inset: 0, background: "rgba(8,12,20,0.85)" }} />

      {/* Card */}
      <div style={{
        position: "relative",
        zIndex: 10,
        background: "#110f1a",
        border: "1px solid #2a2010",
        borderRadius: "24px",
        padding: "32px 28px",
        maxWidth: "420px",
        width: "92%",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          <span className="logo-cronos select-none" style={{ fontSize: "32px" }} />
        </div>

        <h1 style={{
          textAlign: "center",
          color: "#f0f4ff",
          fontSize: "18px",
          fontWeight: 700,
          margin: "0 0 6px",
        }}>
          Restablecer contraseña
        </h1>
        <p style={{
          textAlign: "center",
          color: "#8a7a50",
          fontSize: "13px",
          marginBottom: "28px",
        }}>
          Te enviaremos un email con instrucciones
        </p>

        {sent ? (
          <div style={{ display: "grid", gap: "16px", textAlign: "center" }}>
            <div style={{
              background: "rgba(255,140,0,0.08)",
              border: "1px solid rgba(255,140,0,0.2)",
              borderRadius: "12px",
              padding: "16px",
              color: "#f0c040",
              fontSize: "14px",
            }}>
              ✓ Revisa tu bandeja de entrada y sigue las instrucciones.
            </div>
            <a
              href="/auth/login"
              style={{
                color: "#f0c040",
                fontSize: "14px",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              ← Volver al login
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                style={inputStyle}
                autoComplete="email"
              />
            </div>

            {errorMsg && (
              <p style={{
                background: "rgba(255,60,60,0.08)",
                border: "1px solid rgba(255,60,60,0.2)",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "13px",
                color: "#f0c040",
                margin: 0,
              }}>
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "20px",
                background: loading ? "#1a1200" : "linear-gradient(135deg, #f0c040, #f0c040)",
                color: "#fff",
                border: "none",
                fontWeight: 800,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Enviando…" : "Enviar instrucciones"}
            </button>

            <a
              href="/auth/login"
              style={{
                textAlign: "center",
                color: "#8a7a50",
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              ← Volver al login
            </a>
          </form>
        )}
      </div>
    </main>
  );
}
