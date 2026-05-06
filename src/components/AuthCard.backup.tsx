"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import Input from "@/components/ui/Input";
import TeamsAutocomplete from "@/components/TeamsAutocomplete";

type AuthType = "login" | "register";

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "10px",
  letterSpacing: "2px",
  color: "#8899bb",
  fontWeight: 700,
  textTransform: "uppercase",
  marginBottom: "6px",
};

export default function AuthCard({ type }: { type: AuthType }) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [team, setTeam] = useState("");
  const [otp, setOtp] = useState("");
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
    if (type === "register") {
      if (!name.trim()) { alert("Escribe tu nombre."); return; }
      if (!team.trim()) { alert("Elige tu equipo favorito."); return; }
    }
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
    if (!code) { alert("Escribe el código SMS."); return; }
    if (!confirmationRef.current) {
      alert("Vuelve a enviar el código.");
      setStep("form");
      return;
    }
    try {
      setVerifying(true);
      const result = await confirmationRef.current.confirm(code);
      if (type === "register" && result.user) {
        await setDoc(
          doc(db, "users", result.user.uid),
          {
            name: name.trim(),
            phone: phone.trim(),
            favoriteTeam: team.trim(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      router.replace("/home");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Código incorrecto.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <>
      <div id="recaptcha-container" className="absolute left-[-9999px] top-[-9999px]" />

      <div style={{
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
          Eventos deportivos · Bay Area
        </p>

        {step === "form" ? (
          <form onSubmit={handleSendCode} style={{ display: "grid", gap: "18px" }}>
            {type === "register" && (
              <div>
                <label style={labelStyle}>Nombre</label>
                <Input
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  className="input-cronos"
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Teléfono</label>
              <Input
                placeholder="+1 415 555 1234"
                value={phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                className="input-cronos"
              />
              <p style={{ fontSize: "11px", color: "#3a5070", marginTop: "4px" }}>
                Formato E.164 (ej. +15005550006).
              </p>
            </div>

            {type === "register" && (
              <div>
                <label style={labelStyle}>Equipo favorito</label>
                <TeamsAutocomplete value={team} onChange={setTeam} />
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              style={{ width: "100%", padding: "14px", borderRadius: "24px", background: "linear-gradient(135deg, #ff6b00, #ff8c00)", color: "#fff", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer", opacity: sending ? 0.7 : 1 }}
            >
              {sending ? "Enviando…" : type === "login" ? "Enviar código" : "Crear cuenta"}
            </button>

            {type === "register" && (
              <p style={{fontSize: '12px', color: '#3a5070', textAlign: 'center', marginTop: '12px'}}>
                Al crear tu cuenta aceptas nuestros{' '}
                <a href="/terms" style={{color: '#00c9ff'}}>términos y condiciones</a>
                , incluyendo el consentimiento para ser grabado en eventos de Cronos.
              </p>
            )}

            <p style={{ textAlign: "center", fontSize: "13px", color: "#8a9ab0" }}>
              {type === "login" ? (
                <>¿No tienes cuenta?{" "}
                  <a href="/auth/register" style={{ color: "#ff8c00", textDecoration: "none" }}>
                    Crea una
                  </a>
                </>
              ) : (
                <>¿Ya tienes cuenta?{" "}
                  <a href="/auth/login" style={{ color: "#ff8c00", textDecoration: "none" }}>
                    Inicia sesión
                  </a>
                </>
              )}
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} style={{ display: "grid", gap: "18px" }}>
            <div>
              <label style={labelStyle}>Código SMS</label>
              <Input
                placeholder="Ingresa el código de 6 dígitos"
                value={otp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                inputMode="numeric"
                className="input-cronos"
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              style={{ width: "100%", padding: "14px", borderRadius: "24px", background: "linear-gradient(135deg, #ff6b00, #ff8c00)", color: "#fff", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer", opacity: verifying ? 0.7 : 1 }}
            >
              {verifying ? "Verificando…" : "Verificar código"}
            </button>

            <button
              type="button"
              onClick={() => setStep("form")}
              style={{
                width: "100%",
                borderRadius: "14px",
                border: "1px solid #142035",
                background: "transparent",
                padding: "12px",
                fontWeight: 600,
                color: "#8a9ab0",
                cursor: "pointer",
              }}
            >
              Cambiar teléfono
            </button>
          </form>
        )}
      </div>
    </>
  );
}
