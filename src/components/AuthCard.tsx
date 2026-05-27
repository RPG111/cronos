"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import TeamsAutocomplete from "@/components/TeamsAutocomplete";
import { useLangStore } from "@/lib/store";

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

function phoneToFakeEmail(phone: string): string {
  let digits = phone.replace(/[\s\-().+]/g, "").replace(/\D/g, "");
  if (digits.length === 10) digits = "1" + digits;
  return `${digits}@cronos.phone`;
}

function authErrorToSpanish(code: string, mode: "email" | "phone" = "email"): string {
  switch (code) {
    case "auth/email-already-in-use":
      return mode === "phone"
        ? "Ya existe una cuenta con este teléfono"
        : "Ya existe una cuenta con este email";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres";
    case "auth/invalid-email":
      return mode === "phone"
        ? "Número de teléfono inválido"
        : "Email inválido";
    case "auth/too-many-requests":
      return "Demasiados intentos. Intenta más tarde";
    default:
      return "Error al crear la cuenta. Intenta de nuevo.";
  }
}

export default function AuthCard({ type: _type }: { type: "login" | "register" }) {
  const router = useRouter();
  const [mode, setMode] = useState<"email" | "phone">("email");

  // Email mode state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [favoriteTeam, setFavoriteTeam] = useState("");

  // Phone mode state
  const [phoneName, setPhoneName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTeam, setPhoneTeam] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [phoneConfirmPassword, setPhoneConfirmPassword] = useState("");
  const [showPhonePassword, setShowPhonePassword] = useState(false);
  const [showPhoneConfirm, setShowPhoneConfirm] = useState(false);

  // Shared state
  const [city, setCity] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) router.replace("/home");
    });
    return () => unsub();
  }, [router]);

  function resetErrors() { setErrorMsg(null); }

  // EMAIL submit
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetErrors();
    if (!name.trim())            { setErrorMsg("El nombre es obligatorio."); return; }
    if (!email.trim())           { setErrorMsg("El email es obligatorio."); return; }
    if (!password)               { setErrorMsg("La contraseña es obligatoria."); return; }
    if (password.length < 6)     { setErrorMsg("La contraseña debe tener al menos 6 caracteres."); return; }
    if (password !== confirmPassword) { setErrorMsg("Las contraseñas no coinciden."); return; }
    try {
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, "users", result.user.uid), {
        name: name.trim(),
        email: email.trim(),
        favoriteTeam: favoriteTeam.trim(),
        city: city.trim(),
        marketingConsent: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      router.replace("/home");
    } catch (err: any) {
      setErrorMsg(authErrorToSpanish(err?.code ?? "", "email"));
    } finally {
      setLoading(false);
    }
  }

  // PHONE submit
  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetErrors();
    if (!phoneName.trim())       { setErrorMsg("El nombre es obligatorio."); return; }
    const rawPhone = phone.trim();
    if (!rawPhone)               { setErrorMsg("El teléfono es obligatorio."); return; }
    if (rawPhone.replace(/\D/g, "").length < 10) {
      setErrorMsg("Escribe tu teléfono con código de país, ej. +1 415 555 1234");
      return;
    }
    if (!phonePassword)          { setErrorMsg("La contraseña es obligatoria."); return; }
    if (phonePassword.length < 6){ setErrorMsg("La contraseña debe tener al menos 6 caracteres."); return; }
    if (phonePassword !== phoneConfirmPassword) { setErrorMsg("Las contraseñas no coinciden."); return; }
    try {
      setLoading(true);
      const fakeEmail = phoneToFakeEmail(rawPhone);
      const result = await createUserWithEmailAndPassword(auth, fakeEmail, phonePassword);
      await setDoc(doc(db, "users", result.user.uid), {
        name: phoneName.trim(),
        phone: rawPhone,
        favoriteTeam: phoneTeam.trim(),
        city: city.trim(),
        marketingConsent: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
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
    <div style={{
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

      {/* Subtítulo */}
      <p style={{
        textAlign: "center",
        color: "#8a7a50",
        fontSize: "12px",
        letterSpacing: "2px",
        textTransform: "uppercase",
        marginBottom: "20px",
      }}>
        Eventos deportivos · Bay Area
      </p>

      {/* Toggle email / phone */}
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
            {m === "email" ? "📧 Con correo" : "📱 Con teléfono"}
          </button>
        ))}
      </div>

      {/* ── EMAIL MODE ── */}
      {mode === "email" && (
        <form onSubmit={handleEmailSubmit} style={{ display: "grid", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Nombre completo</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre" style={inputStyle} autoComplete="name" />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com" style={inputStyle} autoComplete="email" />
          </div>

          <div>
            <label style={labelStyle}>Contraseña</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={{ ...inputStyle, paddingRight: "44px" }}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4a3d28", fontSize: "13px", padding: "4px" }}>
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Confirmar contraseña</label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                style={{ ...inputStyle, paddingRight: "44px" }}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4a3d28", fontSize: "13px", padding: "4px" }}>
                {showConfirm ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Equipo favorito <span style={{ color: "#4a3d28", fontWeight: 400 }}>(opcional)</span></label>
            <TeamsAutocomplete
              value={favoriteTeam}
              onChange={setFavoriteTeam}
              placeholder="Ej. América, Chivas, Barcelona..."
            />
          </div>

          <div>
            <label style={labelStyle}>¿En qué ciudad vives? <span style={{ color: "#4a3d28", fontWeight: 400 }}>(opcional)</span></label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej. San Francisco, Oakland, San Jose..."
              style={inputStyle}
              autoComplete="address-level2"
            />
          </div>

          <ConsentCheckbox checked={marketingConsent} onChange={setMarketingConsent} />

          {errorMsg && <ErrorBox msg={errorMsg} />}

          <SubmitButton loading={loading} label="Registrarse" loadingLabel="Creando cuenta…" disabled={!marketingConsent} />
          <p style={{ textAlign: "center", fontSize: "13px", color: "#8a9ab0", margin: 0 }}>
            ¿Ya tienes cuenta?{" "}
            <a href="/auth/login" style={{ color: "#f0c040", textDecoration: "none" }}>Inicia sesión aquí</a>
          </p>
        </form>
      )}

      {/* ── PHONE MODE ── */}
      {mode === "phone" && (
        <form onSubmit={handlePhoneSubmit} style={{ display: "grid", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Nombre completo</label>
            <input type="text" value={phoneName} onChange={(e) => setPhoneName(e.target.value)}
              placeholder="Tu nombre" style={inputStyle} autoComplete="name" />
          </div>

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
                placeholder="Mínimo 6 caracteres"
                style={{ ...inputStyle, paddingRight: "44px" }}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPhonePassword((v) => !v)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4a3d28", fontSize: "13px", padding: "4px" }}>
                {showPhonePassword ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Confirmar contraseña</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPhoneConfirm ? "text" : "password"}
                value={phoneConfirmPassword}
                onChange={(e) => setPhoneConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                style={{ ...inputStyle, paddingRight: "44px" }}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPhoneConfirm((v) => !v)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4a3d28", fontSize: "13px", padding: "4px" }}>
                {showPhoneConfirm ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Equipo favorito <span style={{ color: "#4a3d28", fontWeight: 400 }}>(opcional)</span></label>
            <TeamsAutocomplete
              value={phoneTeam}
              onChange={setPhoneTeam}
              placeholder="Ej. América, Chivas, Barcelona..."
            />
          </div>

          <div>
            <label style={labelStyle}>¿En qué ciudad vives? <span style={{ color: "#4a3d28", fontWeight: 400 }}>(opcional)</span></label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej. San Francisco, Oakland, San Jose..."
              style={inputStyle}
              autoComplete="address-level2"
            />
          </div>

          <ConsentCheckbox checked={marketingConsent} onChange={setMarketingConsent} />

          {errorMsg && <ErrorBox msg={errorMsg} />}

          <SubmitButton loading={loading} label="Registrarse" loadingLabel="Creando cuenta…" disabled={!marketingConsent} />
          <p style={{ textAlign: "center", fontSize: "13px", color: "#8a9ab0", margin: 0 }}>
            ¿Ya tienes cuenta?{" "}
            <a href="/auth/login" style={{ color: "#f0c040", textDecoration: "none" }}>Inicia sesión aquí</a>
          </p>
        </form>
      )}
    </div>
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

function SubmitButton({ loading, label, loadingLabel, disabled }: { loading: boolean; label: string; loadingLabel: string; disabled?: boolean }) {
  const isDisabled = loading || disabled;
  return (
    <button
      type="submit"
      disabled={isDisabled}
      style={{
        width: "100%",
        padding: "14px",
        borderRadius: "20px",
        background: isDisabled ? "#1a1200" : "linear-gradient(135deg, #f0c040, #f0c040)",
        color: "#fff",
        border: "none",
        fontWeight: 800,
        fontSize: "14px",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.7 : 1,
      }}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

function ConsentCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const { lang } = useLangStore();
  const isEs = lang === "es";
  return (
    <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", cursor: "pointer" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: "2px", accentColor: "#f0c040", flexShrink: 0, width: "16px", height: "16px" }}
      />
      <span style={{ fontSize: "12px", color: "#8a7a50", lineHeight: "1.6" }}>
        {isEs ? "He leído y acepto la " : "I have read and agree to the "}
        <a href="/privacy" style={{ color: "#f0c040", textDecoration: "none" }}>
          {isEs ? "Política de Privacidad" : "Privacy Policy"}
        </a>
        {isEs ? " y los " : " and "}
        <a href="/terms" style={{ color: "#f0c040", textDecoration: "none" }}>
          {isEs ? "Términos y Condiciones" : "Terms and Conditions"}
        </a>
      </span>
    </label>
  );
}
