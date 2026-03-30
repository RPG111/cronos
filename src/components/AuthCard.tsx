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
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import TeamsAutocomplete from "@/components/TeamsAutocomplete";

type AuthType = "login" | "register";

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

      <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-md shadow-xl p-8 text-white">
        <h1
          className={`text-4xl font-extrabold text-center text-emerald-400 ${
            type === "register" ? "mb-2" : "mb-8"
          }`}
        >
          {type === "login" ? "Cronos" : "Crear cuenta"}
        </h1>

        {type === "register" && (
          <p className="mb-6 text-center text-sm text-white/80">
            Eventos Deportivos en vivo cerca de ti
          </p>
        )}

        {step === "form" ? (
          <form onSubmit={handleSendCode} className="space-y-6">
            {type === "register" && (
              <div className="space-y-2">
                <span className="block text-xs tracking-widest text-white/70">NOMBRE</span>
                <Input
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <span className="block text-xs tracking-widest text-white/70">TELÉFONO</span>
              <Input
                placeholder="+1 415 555 1234"
                value={phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
              />
              <p className="text-[11px] text-white/60">Formato E.164 (ej. +15005550006).</p>
            </div>

            {type === "register" && (
              <div className="space-y-2">
                <span className="block text-xs tracking-widest text-white/70">EQUIPO FAVORITO</span>
                <TeamsAutocomplete value={team} onChange={setTeam} />
              </div>
            )}

            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl shadow-lg"
              disabled={sending}
            >
              {sending ? "Enviando…" : type === "login" ? "Enviar código" : "Crear cuenta"}
            </Button>

            <p className="text-center text-white/80 text-sm">
              {type === "login" ? (
                <>¿No tienes cuenta? <a className="underline" href="/auth/register">Crea una</a></>
              ) : (
                <>¿Ya tienes cuenta? <a className="underline" href="/auth/login">Inicia sesión</a></>
              )}
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <span className="block text-xs tracking-widest text-white/70">CÓDIGO SMS</span>
              <Input
                placeholder="Ingresa el código de 6 dígitos"
                value={otp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                inputMode="numeric"
              />
            </div>

            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl shadow-lg"
              disabled={verifying}
            >
              {verifying ? "Verificando…" : "Verificar código"}
            </Button>

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
    </>
  );
}
