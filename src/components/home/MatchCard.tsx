"use client";

import { useEffect, useMemo, useState } from "react";
import { Match } from "@/lib/matches";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import AuthReserveButton from "./AuthReserveButton"; // ⬅️ guardia de auth para el botón

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

// Validación muy sencilla para E.164 (ej. +15551234567)
function looksLikeE164(s?: string) {
  if (!s) return false;
  return /^\+\d{8,15}$/.test(s.trim());
}

export default function MatchCard({ m }: { m: Match }) {
  // modal / estados
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // perfil original
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [origName, setOrigName] = useState<string | undefined>(undefined);
  const [origPhone, setOrigPhone] = useState<string | undefined>(undefined);

  // campos editables (se inicializan con el perfil)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Cargar perfil del usuario (Firestore -> Auth como fallback)
  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        const u = auth.currentUser;
        if (!u) return;
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);

        let n = snap.exists() ? (snap.data().name as string | undefined) : undefined;
        let p = snap.exists() ? (snap.data().phone as string | undefined) : undefined;

        if (!n) n = u.displayName ?? undefined;
        if (!p) p = u.phoneNumber ?? undefined;

        if (!cancelled) {
          setOrigName(n);
          setOrigPhone(p);
          setName(n ?? "");
          setPhone(p ?? "");
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, []);

  const hasProfileChanges = useMemo(
    () => name.trim() !== (origName ?? "") || phone.trim() !== (origPhone ?? ""),
    [name, phone, origName, origPhone]
  );

  // 🔐 AHORA: el guardado de sesión lo hace AuthReserveButton.
  // Esta función SOLO abre el modal cuando hay sesión.
  function openReserve() {
    setError(null);
    setConfirmed(false);
    setOpen(true);
  }

  async function confirmBooking() {
    try {
      setSaving(true);
      setError(null);

      const u = auth.currentUser;
      if (!u) {
        // En teoría no debería pasar porque AuthReserveButton ya verificó,
        // pero por seguridad redirigimos.
        if (typeof window !== "undefined") window.location.href = "/auth/login";
        return;
      }

      // Validaciones mínimas
      if (!name.trim()) {
        setError("Por favor escribe tu nombre.");
        setSaving(false);
        return;
      }
      if (!looksLikeE164(phone)) {
        setError("El teléfono debe estar en formato internacional E.164 (ej. +15005550006).");
        setSaving(false);
        return;
      }

      // Si el usuario cambió nombre o teléfono, guardamos en users/{uid}
      if (hasProfileChanges) {
        await setDoc(
          doc(db, "users", u.uid),
          { name: name.trim(), phone: phone.trim(), updatedAt: serverTimestamp() },
          { merge: true }
        );
        setOrigName(name.trim());
        setOrigPhone(phone.trim());
      }

      // Guardar reserva en bookings
      await addDoc(collection(db, "bookings"), {
        userId: u.uid,
        userName: name.trim(),
        userPhone: phone.trim(),
        matchId: m.id,
        league: m.league,
        home: m.home,
        away: m.away,
        dateISO: m.dateISO,
        restaurant: m.restaurant,
        createdAt: serverTimestamp(),
      });

      setConfirmed(true);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "No se pudo crear la reserva");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Tarjeta del partido */}
      <div className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md p-5 text-white shadow-lg w-full">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-widest text-white/60">{m.league}</div>
            <div className="text-xl font-semibold leading-tight break-words">
              {m.home} <span className="text-white/60">vs</span> {m.away}
            </div>
            <div className="text-sm text-white/80 mt-1">{formatDate(m.dateISO)}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-medium">{m.restaurant.name}</div>
            <div className="text-xs text-white/70">{m.restaurant.address}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          {/* ⬇️ Nuevo: el botón con guardia de sesión */}
          <AuthReserveButton
            eventId={m.id}
            onReserve={openReserve}
            className="flex-1 text-center rounded-xl py-2.5 font-semibold transition-colors shadow bg-emerald-500 hover:bg-emerald-600"
          />

          <button
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10"
            onClick={() => alert("Más detalles (MVP)")}
          >
            Detalles
          </button>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />

          {/* contenido */}
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-6 text-white shadow-2xl">
            {!confirmed ? (
              <>
                <h3 className="text-xl font-bold mb-3">Confirmar reserva</h3>

                {/* Datos del partido */}
                <div className="space-y-3 text-white/85">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-white/60">Partido</div>
                    <div className="font-semibold">
                      {m.home} <span className="text-white/60">vs</span> {m.away}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-white/60">Fecha</div>
                    <div>{formatDate(m.dateISO)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-white/60">Lugar</div>
                    <div>{m.restaurant.name} — {m.restaurant.address}</div>
                  </div>

                  {/* Datos editables del usuario */}
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <div className="text-xs uppercase tracking-widest text-white/60">Tus datos</div>

                    <label className="block text-sm">
                      <span className="text-white/70">Nombre</span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white
                                   placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Tu nombre"
                      />
                    </label>

                    <label className="block text-sm">
                      <span className="text-white/70">Teléfono (E.164)</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1 w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white
                                   placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="+15005550006"
                      />
                    </label>

                    {!looksLikeE164(phone) && phone.length > 0 && (
                      <p className="text-xs text-amber-300">
                        Ejemplo válido: +15005550006 (código de país obligatorio).
                      </p>
                    )}
                  </div>

                  {error && <p className="text-sm text-red-300">{error}</p>}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    className="rounded-xl px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10"
                    onClick={() => setOpen(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    className="rounded-xl px-4 py-2 bg-emerald-500 hover:bg-emerald-600 font-semibold disabled:opacity-60"
                    onClick={confirmBooking}
                    disabled={saving || loadingProfile}
                  >
                    {saving ? "Guardando…" : "Confirmar reserva"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-2">✅ ¡Reserva confirmada!</h3>
                <p className="text-white/80">
                  Te esperamos para <b>{m.home}</b> vs <b>{m.away}</b> en <b>{m.restaurant.name}</b>.
                  <br />
                  <span className="text-white/70">Fecha: {formatDate(m.dateISO)}</span>
                </p>
                <div className="mt-6 flex justify-end">
                  <button
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 font-semibold"
                    onClick={() => setOpen(false)}
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
