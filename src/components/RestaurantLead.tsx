// src/components/RestaurantLead.tsx
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
import { getPublishedEvents, type CronosEvent } from "@/lib/firestore/events";

const db = getFirestore(app);

type Lead = {
  restaurantName: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  capacity: number | "";
  message: string;
};

const EMPTY: Lead = {
  restaurantName: "",
  contactName: "",
  phone: "",
  email: "",
  city: "",
  capacity: "",
  message: "",
};

type SelectedEvent = { id: string; title: string; dateISO: string };

const sectionLabel: React.CSSProperties = {
  fontSize: "10px",
  letterSpacing: "2px",
  color: "#00c9ff",
  textTransform: "uppercase",
  fontWeight: 700,
  marginBottom: "12px",
  display: "block",
};

const fieldLabel: React.CSSProperties = {
  fontSize: "10px",
  letterSpacing: "2px",
  color: "#3a5070",
  textTransform: "uppercase",
  fontWeight: 700,
  marginBottom: "6px",
  display: "block",
};

const inputStyle: React.CSSProperties = {
  background: "#0d1528",
  border: "1px solid #142035",
  borderRadius: "11px",
  padding: "12px 14px",
  color: "#c8d8f0",
  width: "100%",
  outline: "none",
  fontSize: "14px",
  boxSizing: "border-box",
};

function fmtMonth(iso: string) {
  return new Date(iso).toLocaleString("es-MX", { month: "short" }).toUpperCase();
}
function fmtDay(iso: string) {
  return new Date(iso).getDate();
}

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
  const [events, setEvents] = useState<CronosEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<SelectedEvent[]>([]);
  const [eventsOpen, setEventsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const auth = getAuth(app);
    return onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
  }, []);

  useEffect(() => {
    getPublishedEvents().then(setEvents);
  }, []);

  useEffect(() => {
    if (open) {
      setLead(EMPTY);
      setSuccess(false);
      setErrorMsg(null);
      setSelectedEvents([]);
      setEventsOpen(false);
    }
  }, [open]);

  function set<K extends keyof Lead>(k: K, v: Lead[K]) {
    setLead((p) => ({ ...p, [k]: v }));
  }

  function toggleEvent(ev: CronosEvent) {
    setSelectedEvents((prev) => {
      const has = prev.some((e) => e.id === ev.id);
      if (has) return prev.filter((e) => e.id !== ev.id);
      return [...prev, { id: ev.id, title: ev.title, dateISO: ev.dateISO }];
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

    if (!lead.restaurantName.trim()) { setErrorMsg("El nombre del restaurante es obligatorio."); return; }
    if (!lead.contactName.trim())    { setErrorMsg("El nombre de contacto es obligatorio."); return; }
    if (!lead.phone.trim())          { setErrorMsg("El teléfono es obligatorio."); return; }
    if (!lead.email.trim())          { setErrorMsg("El email es obligatorio."); return; }
    if (!lead.city.trim())           { setErrorMsg("La ciudad es obligatoria."); return; }

    setSaving(true);
    try {
      const payload = {
        restaurantName:  lead.restaurantName.trim(),
        contactName:     lead.contactName.trim(),
        phone:           lead.phone.trim(),
        email:           lead.email.trim(),
        city:            lead.city.trim(),
        capacity:        lead.capacity !== "" ? Number(lead.capacity) : null,
        message:         lead.message.trim() || null,
        selectedEvents:  selectedEvents,
        uid:             uid ?? null,
        status:          "new",
        createdAt:       serverTimestamp(),
      };

      // 1. Save to Firestore
      await addDoc(collection(db, "leads_restaurants"), payload);

      // 2. Notify via email (fire-and-forget)
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
          message:        payload.message,
          uid:            payload.uid,
        }),
      }).catch((err) => console.warn("Email notification failed (non-blocking):", err));

      // 3. Show success and auto-close
      setSuccess(true);
      setTimeout(() => { onClose(); }, 2000);
    } catch (err: any) {
      console.error("Error en submit", err);
      setErrorMsg("No se pudo enviar. Intenta más tarde.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: "touch", paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 backdrop-blur-sm" style={{ background: "#080c14cc" }} onClick={onClose} />

      {/* Panel */}
      <div className="relative z-[71] mx-auto my-6 w-[min(92vw,34rem)]">
        <div
          ref={scrollRef}
          style={{
            background: "#080c14e8",
            border: "1px solid #142035",
            borderRadius: "24px",
            padding: "24px 20px",
            color: "#c8d8f0",
            maxHeight: "90dvh",
            overflowY: "auto",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "21px", fontWeight: 700, color: "#e8f0ff", margin: 0, lineHeight: 1.3, maxWidth: "80%" }}>
              Solicita un evento en tu restaurante
            </h2>
            <button
              onClick={onClose}
              style={{ background: "#0d1528", border: "1px solid #142035", borderRadius: "8px", color: "#3a5070", padding: "4px 10px", cursor: "pointer", fontSize: "16px", flexShrink: 0 }}
            >
              ✕
            </button>
          </div>

          {/* ── Success state ── */}
          {success ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "32px 0", textAlign: "center" }}>
              <div style={{ fontSize: "48px" }}>🎉</div>
              <p style={{ fontSize: "18px", fontWeight: 600, color: "#00ff9d" }}>¡Gracias! Te contactaremos pronto.</p>
              <p style={{ fontSize: "13px", color: "#3a5070" }}>Cerrando…</p>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: "grid", gap: "20px" }}>

              {/* SECCIÓN: Información del restaurante */}
              <div>
                <span style={sectionLabel}>Información del restaurante</span>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <label style={fieldLabel}>Nombre del restaurante *</label>
                    <input
                      value={lead.restaurantName}
                      onChange={(e) => set("restaurantName", e.target.value)}
                      onFocus={scrollIntoView}
                      style={inputStyle}
                      placeholder="Ej. La Tribuna Sports Bar"
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={fieldLabel}>Ciudad *</label>
                      <input
                        value={lead.city}
                        onChange={(e) => set("city", e.target.value)}
                        onFocus={scrollIntoView}
                        style={inputStyle}
                        placeholder="Ciudad, Estado"
                      />
                    </div>
                    <div>
                      <label style={fieldLabel}>Capacidad</label>
                      <input
                        inputMode="numeric"
                        value={lead.capacity}
                        onChange={(e) => set("capacity", e.target.value ? Number(e.target.value) : "")}
                        onFocus={scrollIntoView}
                        style={inputStyle}
                        placeholder="Ej. 120"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN: Contacto */}
              <div>
                <span style={sectionLabel}>Contacto</span>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <label style={fieldLabel}>Nombre de contacto *</label>
                    <input
                      value={lead.contactName}
                      onChange={(e) => set("contactName", e.target.value)}
                      onFocus={scrollIntoView}
                      style={inputStyle}
                      placeholder="Ej. Daniela López"
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={fieldLabel}>Teléfono *</label>
                      <input
                        value={lead.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        onFocus={scrollIntoView}
                        style={inputStyle}
                        placeholder="+1 415 555 1234"
                      />
                    </div>
                    <div>
                      <label style={fieldLabel}>Email *</label>
                      <input
                        type="email"
                        value={lead.email}
                        onChange={(e) => set("email", e.target.value)}
                        onFocus={scrollIntoView}
                        style={inputStyle}
                        placeholder="contacto@rest.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN: Partidos */}
              <div>
                <span style={sectionLabel}>Partidos que te interesan</span>

                {/* Botón trigger */}
                <button
                  type="button"
                  onClick={() => setEventsOpen((v) => !v)}
                  style={{
                    width: "100%",
                    background: "#0d1528",
                    border: `1px solid ${eventsOpen ? "#00c9ff50" : "#142035"}`,
                    borderRadius: "11px",
                    padding: "12px 14px",
                    color: selectedEvents.length ? "#c8d8f0" : "#3a5070",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "14px",
                  }}
                >
                  <span>
                    {selectedEvents.length === 0
                      ? "Selecciona partidos…"
                      : `${selectedEvents.length} partido${selectedEvents.length > 1 ? "s" : ""} seleccionado${selectedEvents.length > 1 ? "s" : ""}`}
                  </span>
                  <span style={{ color: "#3a5070", fontSize: "12px" }}>{eventsOpen ? "▲" : "▼"}</span>
                </button>

                {/* Badge contador */}
                {selectedEvents.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <span style={{
                      background: "rgba(0,255,157,0.1)",
                      border: "1px solid rgba(0,255,157,0.25)",
                      color: "#00ff9d",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "4px 12px",
                      borderRadius: "20px",
                    }}>
                      ✓ {selectedEvents.length} partido{selectedEvents.length > 1 ? "s" : ""} seleccionado{selectedEvents.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                {/* Popup inline grid */}
                {eventsOpen && (
                  <div style={{
                    marginTop: "10px",
                    background: "#0a0f1a",
                    border: "1px solid #142035",
                    borderRadius: "14px",
                    padding: "12px",
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "8px",
                  }}>
                    {events.length === 0 && (
                      <p style={{ gridColumn: "1/-1", color: "#3a5070", fontSize: "12px", textAlign: "center", padding: "16px 0" }}>
                        No hay eventos disponibles.
                      </p>
                    )}
                    {events.map((ev) => {
                      const selected = selectedEvents.some((e) => e.id === ev.id);
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => toggleEvent(ev)}
                          style={{
                            background: selected ? "#0a1a10" : "#0d1528",
                            border: `1px solid ${selected ? "#00ff9d50" : "#142035"}`,
                            borderRadius: "10px",
                            padding: "8px 6px",
                            cursor: "pointer",
                            textAlign: "center",
                            position: "relative",
                            transition: "border-color 0.15s",
                          }}
                        >
                          {selected && (
                            <span style={{
                              position: "absolute",
                              top: "4px",
                              right: "5px",
                              color: "#00ff9d",
                              fontSize: "10px",
                              fontWeight: 700,
                            }}>✓</span>
                          )}
                          <div style={{ fontSize: "10px", color: "#3a5070", marginBottom: "2px" }}>
                            {fmtMonth(ev.dateISO)}
                          </div>
                          <div style={{ fontSize: "22px", fontWeight: 800, color: "#e8f0ff", lineHeight: 1 }}>
                            {fmtDay(ev.dateISO)}
                          </div>
                          <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "2px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "3px", justifyContent: "center" }}>
                              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#00ff9d", flexShrink: 0 }} />
                              <span style={{ fontSize: "8px", color: "#c8d8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "40px" }}>
                                {ev.homeTeam}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "3px", justifyContent: "center" }}>
                              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#00c9ff", flexShrink: 0 }} />
                              <span style={{ fontSize: "8px", color: "#c8d8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "40px" }}>
                                {ev.awayTeam}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontSize: "9px", color: "#3a5070", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ev.league}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECCIÓN: Notas adicionales */}
              <div>
                <span style={sectionLabel}>Notas adicionales</span>
                <textarea
                  rows={3}
                  value={lead.message}
                  onChange={(e) => set("message", e.target.value)}
                  onFocus={scrollIntoView}
                  style={{ ...inputStyle, resize: "vertical" }}
                  placeholder="Cuéntanos sobre tu espacio o disponibilidad."
                />
              </div>

              {/* Error */}
              {errorMsg && (
                <p style={{
                  background: "rgba(255,60,60,0.08)",
                  border: "1px solid rgba(255,60,60,0.2)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#ff6b6b",
                }}>
                  {errorMsg}
                </p>
              )}

              {/* Botones */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  style={{
                    flex: 1,
                    borderRadius: "14px",
                    border: "1px solid #142035",
                    background: "transparent",
                    padding: "13px",
                    fontWeight: 600,
                    color: "#3a5070",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 2,
                    borderRadius: "14px",
                    border: "none",
                    background: saving ? "#1a2a1a" : "linear-gradient(135deg, #00e88a, #00c9ff)",
                    padding: "13px",
                    fontWeight: 800,
                    color: "#040e18",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontSize: "15px",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "Enviando…" : "Solicitar evento"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
