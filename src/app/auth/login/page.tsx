// src/app/auth/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { useTranslation, type Translations } from "@/lib/i18n";

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

function authLoginError(code: string, mode: "email" | "phone", t: Translations): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return mode === "phone" ? t.auth.errNoAccountPhone : t.auth.errNoAccountEmail;
    case "auth/wrong-password":
      return t.auth.errWrongPassword;
    case "auth/invalid-email":
      return mode === "phone" ? t.auth.errInvalidPhone : t.auth.errInvalidEmail;
    case "auth/too-many-requests":
      return t.auth.errTooManyRequests;
    default:
      return t.auth.errLoginDefault;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslation();
  const [mode, setMode] = useState<"email" | "phone">("email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    if (!email.trim()) { setErrorMsg(t.auth.emailRequired); return; }
    if (!password)     { setErrorMsg(t.auth.passwordRequired); return; }
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/home");
    } catch (err: any) {
      setErrorMsg(authLoginError(err?.code ?? "", "email", t));
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoneLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!phone.trim())  { setErrorMsg(t.auth.phoneRequired); return; }
    if (!phonePassword) { setErrorMsg(t.auth.passwordRequired); return; }
    try {
      setLoading(true);
      const fakeEmail = phoneToFakeEmail(phone.trim());
      await signInWithEmailAndPassword(auth, fakeEmail, phonePassword);
      router.replace("/home");
    } catch (err: any) {
      setErrorMsg(authLoginError(err?.code ?? "", "phone", t));
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
      background: "#09080f",
    }}>
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
        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          <span className="logo-cronos select-none" style={{ fontSize: "32px" }} />
        </div>

        <p style={{
          textAlign: "center",
          color: "#8a7a50",
          fontSize: "12px",
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginBottom: "20px",
        }}>
          {t.auth.tagline}
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6px",
          background: "#110f1a",
          border: "1px solid #2a2010",
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
                background: mode === m ? "#f0c040" : "transparent",
                color: mode === m ? "#fff" : "#8a7a50",
                fontWeight: mode === m ? 700 : 500,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {m === "email" ? `📧 ${t.auth.withEmail}` : `📱 ${t.auth.withPhone}`}
            </button>
          ))}
        </div>

        {/* ── EMAIL MODE ── */}
        {mode === "email" && (
          <form onSubmit={handleEmailLogin} style={{ display: "grid", gap: "18px" }}>
            <div>
              <label style={labelStyle}>{t.auth.email}</label>
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
              <label style={labelStyle}>{t.auth.password}</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.auth.yourPassword}
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
                    color: "#4a3d28",
                    fontSize: "13px",
                    padding: "4px",
                  }}
                >
                  {showPassword ? t.auth.hide : t.auth.show}
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
                background: loading ? "#1a1200" : "linear-gradient(135deg, #f0c040, #f0c040)",
                color: "#fff",
                border: "none",
                fontWeight: 800,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? t.auth.signingIn : t.auth.login}
            </button>

            <a
              href="/auth/forgot-password"
              style={{ color: "#8a7a50", fontSize: "13px", textAlign: "center", textDecoration: "none" }}
            >
              {t.auth.forgotPassword}
            </a>

            <p style={{ textAlign: "center", fontSize: "13px", color: "#8a9ab0", margin: 0 }}>
              {t.auth.noAccount}{" "}
              <a href="/auth/register" style={{ color: "#f0c040", textDecoration: "none" }}>
                {t.auth.registerHere}
              </a>
            </p>
          </form>
        )}

        {/* ── PHONE MODE ── */}
        {mode === "phone" && (
          <form onSubmit={handlePhoneLogin} style={{ display: "grid", gap: "18px" }}>
            <div>
              <label style={labelStyle}>{t.auth.phone}</label>
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
              <label style={labelStyle}>{t.auth.password}</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPhonePassword ? "text" : "password"}
                  value={phonePassword}
                  onChange={(e) => setPhonePassword(e.target.value)}
                  placeholder={t.auth.yourPassword}
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
                    color: "#4a3d28",
                    fontSize: "13px",
                    padding: "4px",
                  }}
                >
                  {showPhonePassword ? t.auth.hide : t.auth.show}
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
                background: loading ? "#1a1200" : "linear-gradient(135deg, #f0c040, #f0c040)",
                color: "#fff",
                border: "none",
                fontWeight: 800,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? t.auth.signingIn : t.auth.login}
            </button>

            <p style={{ textAlign: "center", fontSize: "13px", color: "#8a9ab0", margin: 0 }}>
              {t.auth.noAccount}{" "}
              <a href="/auth/register" style={{ color: "#f0c040", textDecoration: "none" }}>
                {t.auth.registerHere}
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
      color: "#f0c040",
      margin: 0,
    }}>
      {msg}
    </p>
  );
}
