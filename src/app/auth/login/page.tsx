// src/app/auth/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0d1528",
  border: "1px solid #142035",
  borderRadius: "11px",
  padding: "12px 14px",
  color: "#c8d8f0",
  outline: "none",
  fontSize: "14px",
  boxSizing: "border-box",
};

function phoneToFakeEmail(phone: string): string {
  let digits = phone.replace(/[\s\-().+]/g, "").replace(/\D/g, "");
  if (digits.length === 10) digits = "1" + digits;
  return `${digits}@cronos.phone`;
}

function authErrorToSpanish(code: string, mode: "email" | "phone" = "email"): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return mode === "phone"
        ? "No existe una cuenta con este teléfono"
        : "No existe una cuenta con este email";
    case "auth/wrong-password":
      return "Contraseña incorrecta";
    case "auth/invalid-email":
      return mode === "phone"
        ? "Número de teléfono inválido"
        : "Email inválido";
    case "auth/too-many-requests":
      return "Demasiados intentos. Intenta más tarde";
    default:
      return "Error al iniciar sesión. Verifica tus datos.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"email" | "phone">("email");

  // Email mode
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Phone mode
  const [phone, setPhone] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [showPhonePassword, setShowPhonePassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) router.replace("/home");
    });
    return () => unsub();
  }, [router]);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim()) { setErrorMsg("El email es obligatorio."); return; }
    if (!password)     { setErrorMsg("La contraseña es obligatoria."); return; }
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/home");
    } catch (err: any) {
      setErrorMsg(authErrorToSpanish(err?.code ?? "", "email"));
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoneLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!phone.trim())    { setErrorMsg("El teléfono es obligatorio."); return; }
    if (!phonePassword)   { setErrorMsg("La contraseña es obligatoria."); return; }
    try {
      setLoading(true);
      const fakeEmail = phoneToFakeEmail(phone.trim());
      await signInWithEmailAndPassword(auth, fakeEmail, phonePassword);
      router.replace("/home");
    } catch (err: any) {
      setErrorMsg(authErrorToSpanish(err?.code ?? "", "phone"));
    } finally {
      setLoading(false);
    }
  }

  function switchMode(newMode: "email" | "phone") {
    setMode(newMode);
    setErrorMsg(null);
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
      <div style={{ position: "absolute", inset: 0, background: "rgba(8,12,20,0.85)" }} />

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
          marginBottom: "20px",
        }}>
          eventos deportivos · bay area
        </p>

        {/* Toggle email / phone */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6px",
          background: "#0a1220",
          border: "1px solid #142035",
          borderRadius: "14px",
          padding: "4px",
          marginBottom: "24px",
        }}>
          {(["email", "phone"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              style={{
                padding: "9px",
                borderRadius: "10px",
                border: "none",
                background: mode === m ? "#e63946" : "transparent",
                color: mode === m ? "#fff" : "#8899bb",
                fontWeight: mode === m ? 700 : 500,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {m === "email" ? "📧 Con correo" : "📱 Con teléfono"}
            </button>
          ))}
        </div>

        {/* ── EMAIL MODE ── */}
        {mode === "email" && (
          <form onSubmit={handleEmailLogin} style={{ display: "grid", gap: "18px" }}>
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

            <div>
              <label style={labelStyle}>Contraseña</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#3a5070",
                    fontSize: "13px",
                    padding: "4px",
                  }}
                >
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>

            {errorMsg && <ErrorBox msg={errorMsg} />}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "24px",
                background: loading ? "#1a1200" : "linear-gradient(135deg, #ff6b00, #e63946)",
                color: "#fff",
                border: "none",
                fontWeight: 800,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Ingresando…" : "Iniciar sesión"}
            </button>

            <a
              href="/auth/forgot-password"
              style={{ color: "#8899bb", fontSize: "13px", textAlign: "center", textDecoration: "none" }}
            >
              ¿Olvidaste tu contraseña?
            </a>

            <p style={{ textAlign: "center", fontSize: "13px", color: "#8a9ab0", margin: 0 }}>
              ¿No tienes cuenta?{" "}
              <a href="/auth/register" style={{ color: "#e63946", textDecoration: "none" }}>
                Regístrate aquí
              </a>
            </p>
          </form>
        )}

        {/* ── PHONE MODE ── */}
        {mode === "phone" && (
          <form onSubmit={handlePhoneLogin} style={{ display: "grid", gap: "18px" }}>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 415 555 1234"
                style={inputStyle}
                autoComplete="tel"
              />
            </div>

            <div>
              <label style={labelStyle}>Contraseña</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPhonePassword ? "text" : "password"}
                  value={phonePassword}
                  onChange={(e) => setPhonePassword(e.target.value)}
                  placeholder="Tu contraseña"
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPhonePassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#3a5070",
                    fontSize: "13px",
                    padding: "4px",
                  }}
                >
                  {showPhonePassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>

            {errorMsg && <ErrorBox msg={errorMsg} />}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "24px",
                background: loading ? "#1a1200" : "linear-gradient(135deg, #ff6b00, #e63946)",
                color: "#fff",
                border: "none",
                fontWeight: 800,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Ingresando…" : "Iniciar sesión"}
            </button>

            <p style={{ textAlign: "center", fontSize: "13px", color: "#8a9ab0", margin: 0 }}>
              ¿No tienes cuenta?{" "}
              <a href="/auth/register" style={{ color: "#e63946", textDecoration: "none" }}>
                Regístrate aquí
              </a>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <p style={{
      background: "rgba(255,60,60,0.08)",
      border: "1px solid rgba(255,60,60,0.2)",
      borderRadius: "10px",
      padding: "10px 14px",
      fontSize: "13px",
      color: "#ff6b6b",
      margin: 0,
    }}>
      {msg}
    </p>
  );
}
