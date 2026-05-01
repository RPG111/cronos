// src/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app as firebaseApp } from "../../lib/firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import BottomNav from "../../components/BottomNav";
import { fmtDateShort } from "../../lib/events";
import { getPublishedEvents, type CronosEvent } from "../../lib/firestore/events";
import QRModal, { type QRData } from "../../components/QRModal";
import {
  getSavedFanZoneIds,
  getFanZoneById,
  type FanZone,
} from "../../lib/firestore/fanzones";

type MyRes = {
  event: CronosEvent;
  team: string;
  name?: string;
  phone?: string;
  reserveCode?: string;
};

export default function ProfilePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [events, setEvents] = useState<CronosEvent[]>([]);
  const [items, setItems] = useState<MyRes[]>([]);
  const [resLoading, setResLoading] = useState(false);
  const [savedZones, setSavedZones] = useState<FanZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrData, setQrData] = useState<QRData | null>(null);

  // Auth — sin redirección
  useEffect(() => {
    const auth = getAuth(firebaseApp);
    return onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
      setAuthLoading(false);
    });
  }, []);

  // Cargar eventos para las reservas
  useEffect(() => {
    getPublishedEvents().then(setEvents).catch(console.error);
  }, []);

  // Cargar reservas del usuario
  useEffect(() => {
    if (!uid) { setItems([]); return; }
    (async () => {
      setResLoading(true);
      const db = getFirestore(firebaseApp);
      const out: MyRes[] = [];
      for (const ev of events) {
        const snap = await getDoc(doc(db, "events", ev.id, "attendees", uid));
        if (snap.exists()) {
          const d = snap.data() as any;
          out.push({
            event: ev,
            team: d.team as string,
            name: d.name,
            phone: d.phone,
            reserveCode: d.reserveCode,
          });
        }
      }
      setItems(out);
      setResLoading(false);
    })();
  }, [uid, events]);

  // Cargar Fan Zones guardados
  useEffect(() => {
    if (!uid) { setSavedZones([]); return; }
    (async () => {
      setZonesLoading(true);
      try {
        const ids = await getSavedFanZoneIds(uid);
        const fetched = await Promise.all(ids.map((id) => getFanZoneById(id)));
        setSavedZones(fetched.filter((z): z is FanZone => z !== null));
      } catch {}
      setZonesLoading(false);
    })();
  }, [uid]);

  return (
    <main style={{ minHeight: "100dvh", background: "#080c14" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "32px 20px" }}>

        {/* ── Banner Bay Area — visible para todos ── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(255,107,0,0.12), rgba(255,140,0,0.06))",
          border: "1px solid rgba(255,140,0,0.25)",
          borderRadius: "16px",
          padding: "16px",
          marginBottom: "28px",
        }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#e8f0ff", lineHeight: 1.6 }}>
            Próximos eventos en el Bay Area — Regístrate para ser el primero en asistir a nuestros watch parties y reacciones en vivo.
          </div>
          {!authLoading && !uid && (
            <Link
              href="/auth/login"
              style={{
                display: "inline-block",
                marginTop: "12px",
                background: "linear-gradient(135deg, #ff6b00, #ff8c00)",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 700,
                padding: "8px 16px",
                borderRadius: "20px",
                textDecoration: "none",
              }}
            >
              Registrarme
            </Link>
          )}
        </div>

        {/* ── Heading ── */}
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#e8f0ff", margin: "0 0 6px" }}>
          Mi perfil
        </h1>

        {authLoading ? (
          <div style={{ color: "#8899bb", fontSize: "13px", marginTop: "16px" }}>Cargando…</div>
        ) : !uid ? (
          /* ── Sin sesión ── */
          <div style={{ marginTop: "20px", display: "grid", gap: "12px" }}>
            <div style={{ background: "#0a1220", border: "1px solid #142035", borderRadius: "16px", padding: "16px" }}>
              <p style={{ margin: 0, color: "#8899bb", fontSize: "13px" }}>
                <Link href="/auth/login" style={{ color: "#ff8c00", textDecoration: "underline" }}>
                  Inicia sesión
                </Link>{" "}
                para ver tus reservas y guardar tus Fan Zones favoritos.
              </p>
            </div>

            <div style={{ marginTop: "8px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#e8f0ff", margin: "0 0 10px" }}>
                Mis Fan Zones guardados
              </h2>
              <div style={{ background: "#0a1220", border: "1px solid #142035", borderRadius: "16px", padding: "16px" }}>
                <p style={{ margin: 0, color: "#8899bb", fontSize: "13px" }}>
                  <Link href="/auth/login" style={{ color: "#ff8c00", textDecoration: "underline" }}>
                    Inicia sesión
                  </Link>{" "}
                  para guardar tus favoritos.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ── Con sesión ── */
          <div style={{ marginTop: "20px", display: "grid", gap: "12px" }}>

            {/* Reservas Cronos */}
            <p style={{ margin: 0, color: "#8899bb", fontSize: "13px" }}>Tus reservas confirmadas.</p>

            {resLoading ? (
              <div style={{ background: "#0a1220", border: "1px solid #142035", borderRadius: "16px", padding: "16px", color: "#8899bb", fontSize: "13px" }}>
                Cargando…
              </div>
            ) : items.length === 0 ? (
              <div style={{ background: "#0a1220", border: "1px solid #142035", borderRadius: "16px", padding: "16px", color: "#8899bb", fontSize: "13px" }}>
                Aún no tienes reservas.
              </div>
            ) : (
              items.map((it) => (
                <div key={it.event.id} className="card-chrome-wrap">
                  <div style={{ background: "#0a1220", borderRadius: "18px", padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                      <div>
                        <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#ff8c00", fontWeight: 700, textTransform: "uppercase" }}>
                          {it.event.league}
                        </div>
                        <div style={{ marginTop: "4px", fontSize: "18px", fontWeight: 700, color: "#e8f0ff" }}>
                          {it.event.title}
                        </div>
                        <span style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,140,0,0.12)", border: "1px solid rgba(255,140,0,0.3)", color: "#ff8c00", fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px" }}>
                          Vas — {it.team}
                        </span>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#ff8c00" }}>{it.event.venueName}</div>
                        <div style={{ fontSize: "11px", color: "#8899bb", marginTop: "2px" }}>
                          {it.event.address}<br />{it.event.city}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: "10px", fontSize: "12px", color: "#8899bb" }}>
                      {fmtDateShort(it.event.dateISO)}
                    </div>
                    <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
                      <Link
                        href={`/events/${it.event.id}`}
                        className="btn-primary-cronos"
                        style={{ flex: 1, textAlign: "center", textDecoration: "none", padding: "11px 16px", borderRadius: "24px" }}
                      >
                        Ver / Cancelar
                      </Link>
                      {it.reserveCode && (
                        <button
                          onClick={() => {
                            setQrData({
                              code: it.reserveCode!,
                              eventTitle: it.event.title,
                              userName: it.name,
                              team: it.team,
                            });
                            setQrOpen(true);
                          }}
                          style={{ position: "relative", background: "rgba(192,192,192,0.05)", border: "1px solid rgba(192,192,192,0.2)", color: "#c8d8f0", fontSize: "14px", fontWeight: 600, padding: "11px 16px", borderRadius: "24px", cursor: "pointer", overflow: "hidden", whiteSpace: "nowrap" }}
                        >
                          Ver QR
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* ── Mis Fan Zones guardados ── */}
            <div style={{ marginTop: "8px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#e8f0ff", margin: "0 0 12px" }}>
                Mis Fan Zones guardados
              </h2>

              {zonesLoading ? (
                <div style={{ background: "#0a1220", border: "1px solid #142035", borderRadius: "16px", padding: "16px", color: "#8899bb", fontSize: "13px" }}>
                  Cargando…
                </div>
              ) : savedZones.length === 0 ? (
                <div style={{ background: "#0a1220", border: "1px solid #142035", borderRadius: "16px", padding: "16px", color: "#8899bb", fontSize: "13px" }}>
                  Aún no tienes Fan Zones guardados.{" "}
                  <Link href="/home" style={{ color: "#ff8c00", textDecoration: "underline" }}>
                    Explorar eventos
                  </Link>
                </div>
              ) : (
                savedZones.map((zone) => (
                  <div key={zone.id} style={{ background: "#0a1220", border: "1px solid #142035", borderRadius: "16px", padding: "14px", marginBottom: "10px" }}>
                    {zone.type === "fan_festival" ? (
                      <span style={{ display: "inline-block", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)", color: "#f59e0b", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", marginBottom: "6px" }}>
                        FIFA Fan Festival oficial
                      </span>
                    ) : (
                      <span style={{ display: "inline-block", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)", color: "#60a5fa", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", marginBottom: "6px" }}>
                        Fan Zone
                      </span>
                    )}
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#e8f0ff", marginBottom: "3px" }}>
                      {zone.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#8899bb", marginBottom: "2px" }}>{zone.venue}</div>
                    <div style={{ fontSize: "12px", color: "#8899bb", marginBottom: "10px" }}>📅 {zone.datesOpen}</div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {zone.registrationUrl && (
                        <a
                          href={zone.registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ background: "linear-gradient(135deg,#ff6b00,#ff8c00)", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "6px 12px", borderRadius: "16px", textDecoration: "none" }}
                        >
                          Registrarse
                        </a>
                      )}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(zone.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ background: "rgba(192,192,192,0.07)", border: "1px solid rgba(192,192,192,0.2)", color: "#c8d8f0", fontSize: "11px", fontWeight: 600, padding: "6px 12px", borderRadius: "16px", textDecoration: "none" }}
                      >
                        Cómo llegar
                      </a>
                      {zone.officialUrl && (
                        <a
                          href={zone.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#8899bb", fontSize: "10px", textDecoration: "underline", padding: "6px 2px" }}
                        >
                          Sitio oficial
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        <div style={{ height: "96px" }} />
      </div>

      <QRModal open={qrOpen} onClose={() => setQrOpen(false)} data={qrData} />
      <BottomNav />
    </main>
  );
}
