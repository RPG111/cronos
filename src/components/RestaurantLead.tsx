// src/components/restaurant/RestaurantLead.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { app } from "@/lib/firebase";
import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, getAuth } from "firebase/auth";

/** Helper para abrir el modal desde cualquier lugar */
export function openRestaurantLead() {
  window.dispatchEvent(new Event("open-restaurant-lead"));
}

const db = getFirestore(app);

type Lead = {
  restaurantName: string;
  contactName: string;
  city: string;
  phone?: string;
  email?: string;
  capacity?: number | "";
  screens?: number | "";
  sports?: string[];
  message?: string;
  uid?: string | null;
  createdAt?: any;
  // extras
  status?: "new" | "contacted" | "qualified" | "won" | "lost";
  source?: string;
};

const SPORTS = ["Fútbol", "Box", "Básquet", "Béisbol", "NFL"];

type Props = {
  /** Controlado externamente (opcional). Si no lo pasas, el componente se controla solo y escucha el evento 'open-restaurant-lead'. */
  open?: boolean;
  /** Cerrar desde el padre (opcional). Si no lo pasas, el componente se cierra solo. */
  onClose?: () => void;
  /** Etiqueta de fuente para analytics (opcional) */
  source?: string; // ej. 'header_modal' | 'footer_cta' | 'qr_flyer'
};

export default function RestaurantLead({ open: propOpen, onClose: propOnClose, source = "header_modal" }: Props) {
  // Estado interno solo si NO es controlado
  const isControlled = typeof propOpen === "boolean";
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? (propOpen as boolean) : internalOpen;

  const [uid, setUid] = useState<string | null>(null);

  const [lead, setLead] = useState<Lead>({
    restaurantName: "",
    contactName: "",
    city: "",
    phone: "",
    email: "",
    capacity: "",
    screens: "",
    sports: [],
    message: "",
  });

  // Escucha login
  useEffect(() => {
    const auth = getAuth(app);
    return onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
  }, []);

  // Escucha el "open-restaurant-lead" solo si NO es controlado desde props
  useEffect(() => {
    if (isControlled) return;
    const handler = () => setInternalOpen(true);
    window.addEventListener("open-restaurant-lead", handler as EventListener);
    return () => window.removeEventListener("open-restaurant-lead", handler as EventListener);
  }, [isControlled]);

  const canSubmit = useMemo(() => {
    const hasContact = !!(lead.phone?.trim() || lead.email?.trim());
    return (
      lead.restaurantName.trim().length > 1 &&
      lead.contactName.trim().length > 1 &&
      lead.city.trim().length > 1 &&
      hasContact
    );
  }, [lead]);

  const reset = () =>
    setLead({
      restaurantName: "",
      contactName: "",
      city: "",
      phone: "",
      email: "",
      capacity: "",
      screens: "",
      sports: [],
      message: "",
    });

  function closeModal() {
    if (propOnClose) return propOnClose();
    setInternalOpen(false);
  }

  async function submit() {
    if (!canSubmit) return alert("Completa los campos obligatorios.");
    try {
      const payload: Lead = {
        restaurantName: lead.restaurantName.trim(),
        contactName: lead.contactName.trim(),
        city: lead.city.trim(),
        phone: lead.phone?.trim() || undefined,
        email: lead.email?.trim() || undefined,
        capacity:
          typeof lead.capacity === "number" ? lead.capacity : Number(lead.capacity || 0) || undefined,
        screens:
          typeof lead.screens === "number" ? lead.screens : Number(lead.screens || 0) || undefined,
        sports: lead.sports && lead.sports.length ? lead.sports : [],
        message: lead.message?.trim() || undefined,
        uid: uid ?? null,
        createdAt: serverTimestamp(),

        // 🔹 Extras que te propuse (útiles para pipeline):
        status: "new",
        source, // ej. "header_modal"
      };

      await addDoc(collection(db, "leads_restaurants"), payload);

      alert("¡Gracias! Te contactaremos muy pronto.");
      closeModal();
      reset();
    } catch (e) {
      console.error(e);
      alert("No se pudo enviar. Intenta más tarde.");
    }
  }

  const toggleSport = (s: string) =>
    setLead((prev) => {
      const has = prev.sports?.includes(s);
      return {
        ...prev,
        sports: has
          ? (prev.sports || []).filter((x) => x !== s)
          : [ ...(prev.sports || []), s ],
      };
    });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeModal}
      />
      <div className="absolute inset-x-0 top-8 z-[71] mx-auto w-[min(92vw,34rem)] rounded-2xl border border-white/10 bg-zinc-900/95 p-5 text-white shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Trabaja con Cronos</h2>
          <button
            onClick={closeModal}
            className="rounded-md px-2 py-1 text-white/70 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-white/70">
          Déjanos tus datos y te contactamos para llevar gente a tu restaurante en días de evento.
        </p>

        <div className="grid gap-3">
          <div className="grid gap-1">
            <label className="text-xs text-white/70">Nombre del restaurante *</label>
            <input
              value={lead.restaurantName}
              onChange={(e) => setLead({ ...lead, restaurantName: e.target.value })}
              className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 outline-none focus:border-emerald-500"
              placeholder="Ej. La Tribuna Sports Bar"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-xs text-white/70">Nombre de contacto *</label>
            <input
              value={lead.contactName}
              onChange={(e) => setLead({ ...lead, contactName: e.target.value })}
              className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 outline-none focus:border-emerald-500"
              placeholder="Ej. Daniela López"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-xs text-white/70">Ciudad *</label>
            <input
              value={lead.city}
              onChange={(e) => setLead({ ...lead, city: e.target.value })}
              className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 outline-none focus:border-emerald-500"
              placeholder="Ciudad, Estado"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 max-[380px]:grid-cols-1">
            <div className="grid gap-1">
              <label className="text-xs text-white/70">Teléfono</label>
              <input
                value={lead.phone}
                onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 outline-none focus:border-emerald-500"
                placeholder="+1 415 555 1234"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-white/70">Email</label>
              <input
                type="email"
                value={lead.email}
                onChange={(e) => setLead({ ...lead, email: e.target.value })}
                className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 outline-none focus:border-emerald-500"
                placeholder="contacto@restaurante.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 max-[380px]:grid-cols-1">
            <div className="grid gap-1">
              <label className="text-xs text-white/70">Capacidad (opcional)</label>
              <input
                inputMode="numeric"
                value={lead.capacity}
                onChange={(e) => setLead({ ...lead, capacity: e.target.value ? Number(e.target.value) : "" })}
                className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 outline-none focus:border-emerald-500"
                placeholder="Ej. 120"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-white/70">Pantallas (opcional)</label>
              <input
                inputMode="numeric"
                value={lead.screens}
                onChange={(e) => setLead({ ...lead, screens: e.target.value ? Number(e.target.value) : "" })}
                className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 outline-none focus:border-emerald-500"
                placeholder="Ej. 8"
              />
            </div>
          </div>

          <div className="grid gap-1">
            <label className="text-xs text-white/70">Deportes de interés</label>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map((s) => {
                const active = lead.sports?.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      const has = active;
                      setLead((prev) => ({
                        ...prev,
                        sports: has
                          ? (prev.sports || []).filter((x) => x !== s)
                          : [ ...(prev.sports || []), s ],
                      }));
                    }}
                    className={`rounded-full px-3 py-1 text-sm ${
                      active ? "bg-emerald-600 text-white" : "bg-white/10 text-white/80 hover:bg-white/15"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-1">
            <label className="text-xs text-white/70">Mensaje (opcional)</label>
            <textarea
              rows={3}
              value={lead.message}
              onChange={(e) => setLead({ ...lead, message: e.target.value })}
              className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 outline-none focus:border-emerald-500"
              placeholder="Cuéntanos si tienes promociones o tu disponibilidad."
            />
          </div>

          <div className="mt-2 flex gap-3">
            <button
              onClick={closeModal}
              className="w-1/2 rounded-xl border border-white/15 bg-black/40 py-2 text-white hover:bg-black/50"
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={!canSubmit}
              className="w-1/2 rounded-xl bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
