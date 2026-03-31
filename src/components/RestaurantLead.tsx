// src/components/restaurant/RestaurantLead.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { app } from "@/lib/firebase";
import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, getAuth } from "firebase/auth";

const db = getFirestore(app);

const SPORTS = ["Fútbol", "Boxeo", "NFL", "NBA", "Béisbol"];

type Lead = {
  restaurantName: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  capacity: number | "";
  sports: string[];
  message: string;
};

const EMPTY: Lead = {
  restaurantName: "",
  contactName: "",
  phone: "",
  email: "",
  city: "",
  capacity: "",
  sports: [],
  message: "",
};

export default function RestaurantLead({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [uid, setUid] = useState<string | null>(null);
  const [lead, setLead] = useState<Lead>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const auth = getAuth(app);
    return onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setLead(EMPTY);
      setSuccess(false);
      setErrorMsg(null);
    }
  }, [open]);

  function set<K extends keyof Lead>(k: K, v: Lead[K]) {
    setLead((p) => ({ ...p, [k]: v }));
  }

  function toggleSport(s: string) {
    setLead((prev) => {
      const has = prev.sports.includes(s);
      return {
        ...prev,
        sports: has ? prev.sports.filter((x) => x !== s) : [...prev.sports, s],
      };
    });
  }

  function scrollIntoView(e: React.FocusEvent<HTMLElement>) {
    const el = e.currentTarget;
    setTimeout(() => {
      if (el && document.contains(el)) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }, 60);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    console.log('Submit iniciado', lead);

    // Validation
    if (!lead.restaurantName.trim()) { setErrorMsg("El nombre del restaurante es obligatorio."); return; }
    if (!lead.contactName.trim())    { setErrorMsg("El nombre de contacto es obligatorio."); return; }
    if (!lead.phone.trim())          { setErrorMsg("El teléfono es obligatorio."); return; }
    if (!lead.email.trim())          { setErrorMsg("El email es obligatorio."); return; }
    if (!lead.city.trim())           { setErrorMsg("La ciudad es obligatoria."); return; }

    setSaving(true);
    try {
      const payload = {
        restaurantName: lead.restaurantName.trim(),
        contactName:    lead.contactName.trim(),
        phone:          lead.phone.trim(),
        email:          lead.email.trim(),
        city:           lead.city.trim(),
        capacity:       lead.capacity !== "" ? Number(lead.capacity) : null,
        sports:         lead.sports,
        message:        lead.message.trim() || null,
        uid:            uid ?? null,
        status:         "new",
        createdAt:      serverTimestamp(),
      };

      // 1. Save to Firestore
      const docRef = await addDoc(collection(db, "leads_restaurants"), payload);
      console.log('Firestore OK', docRef);

      // 2. Notify via email (fire-and-forget — don't block UX on email failure)
      console.log('Llamando a email API');
      fetch("/api/leads/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName: payload.restaurantName,
          contactName:    payload.contactName,
          phone:          payload.phone,
          email:          payload.email,
          city:           payload.city,
          capacity:       payload.capacity,
          sports:         payload.sports,
          message:        payload.message,
          uid:            payload.uid,
        }),
      }).then(async (emailResp) => {
        console.log('Email API response', emailResp.status, await emailResp.text());
      }).catch((err) => console.warn("Email notification failed (non-blocking):", err));

      // 3. Show success and auto-close
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Error en submit', err);
      setErrorMsg("No se pudo enviar. Intenta más tarde.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const inputCls = "rounded-xl border border-white/15 bg-black/40 px-3 py-2 outline-none focus:border-emerald-500 text-white placeholder-white/40";
  const labelCls = "text-xs text-white/70";

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain"
      style={{
        WebkitOverflowScrolling: "touch",
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
      }}
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-[71] mx-auto my-6 w-[min(92vw,34rem)]">
        <div
          ref={scrollRef}
          className="max-h-[85dvh] overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900/95 p-5 text-white shadow-2xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Trabaja con Cronos</h2>
            <button onClick={onClose} className="rounded-md px-2 py-1 text-white/70 hover:bg-white/10">✕</button>
          </div>

          <p className="mb-4 text-sm text-white/70">
            Déjanos tus datos y te contactamos para llevar gente a tu restaurante en días de evento.
          </p>

          {/* ── Success state ── */}
          {success ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="text-4xl">🎉</div>
              <p className="text-lg font-semibold text-emerald-300">¡Gracias! Te contactaremos pronto.</p>
              <p className="text-sm text-white/60">Cerrando…</p>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-3">
              {/* Nombre restaurante */}
              <div className="grid gap-1">
                <label className={labelCls}>Nombre del restaurante *</label>
                <input
                  value={lead.restaurantName}
                  onChange={(e) => set("restaurantName", e.target.value)}
                  onFocus={scrollIntoView}
                  className={inputCls}
                  placeholder="Ej. La Tribuna Sports Bar"
                />
              </div>

              {/* Nombre contacto */}
              <div className="grid gap-1">
                <label className={labelCls}>Nombre de contacto *</label>
                <input
                  value={lead.contactName}
                  onChange={(e) => set("contactName", e.target.value)}
                  onFocus={scrollIntoView}
                  className={inputCls}
                  placeholder="Ej. Daniela López"
                />
              </div>

              {/* Teléfono + Email */}
              <div className="grid grid-cols-2 gap-3 max-[380px]:grid-cols-1">
                <div className="grid gap-1">
                  <label className={labelCls}>Teléfono *</label>
                  <input
                    value={lead.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    onFocus={scrollIntoView}
                    className={inputCls}
                    placeholder="+1 415 555 1234"
                  />
                </div>
                <div className="grid gap-1">
                  <label className={labelCls}>Email *</label>
                  <input
                    type="email"
                    value={lead.email}
                    onChange={(e) => set("email", e.target.value)}
                    onFocus={scrollIntoView}
                    className={inputCls}
                    placeholder="contacto@rest.com"
                  />
                </div>
              </div>

              {/* Ciudad */}
              <div className="grid gap-1">
                <label className={labelCls}>Ciudad *</label>
                <input
                  value={lead.city}
                  onChange={(e) => set("city", e.target.value)}
                  onFocus={scrollIntoView}
                  className={inputCls}
                  placeholder="Ciudad, Estado"
                />
              </div>

              {/* Capacidad */}
              <div className="grid gap-1">
                <label className={labelCls}>Capacidad aproximada (opcional)</label>
                <input
                  inputMode="numeric"
                  value={lead.capacity}
                  onChange={(e) => set("capacity", e.target.value ? Number(e.target.value) : "")}
                  onFocus={scrollIntoView}
                  className={inputCls}
                  placeholder="Ej. 120"
                />
              </div>

              {/* Deportes */}
              <div className="grid gap-1">
                <label className={labelCls}>Deportes que les interesa transmitir</label>
                <div className="flex flex-wrap gap-2">
                  {SPORTS.map((s) => {
                    const active = lead.sports.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSport(s)}
                        className={`rounded-full px-3 py-1 text-sm transition ${
                          active
                            ? "bg-emerald-600 text-white"
                            : "bg-white/10 text-white/80 hover:bg-white/15"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mensaje */}
              <div className="grid gap-1">
                <label className={labelCls}>Mensaje adicional (opcional)</label>
                <textarea
                  rows={3}
                  value={lead.message}
                  onChange={(e) => set("message", e.target.value)}
                  onFocus={scrollIntoView}
                  className={inputCls}
                  placeholder="Cuéntanos sobre tu espacio o disponibilidad."
                />
              </div>

              {/* Error */}
              {errorMsg && (
                <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {errorMsg}
                </p>
              )}

              {/* Buttons */}
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="w-1/2 rounded-xl border border-white/15 bg-black/40 py-2 text-white hover:bg-black/50 transition disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-1/2 rounded-xl bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-60"
                >
                  {saving ? "Enviando…" : "Enviar"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
