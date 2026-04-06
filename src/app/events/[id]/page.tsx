// src/app/events/[id]/page.tsx
"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState, use } from "react";
import { fmtDateLong } from "../../../lib/events";
import { getEventById, type CronosEvent } from "../../../lib/firestore/events";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { app as firebaseApp } from "../../../lib/firebase";
import BottomNav from "../../../components/BottomNav";

const MapView = dynamic(() => import("./map-view"), { ssr: false });

function mapsLinks(ev: CronosEvent) {
  const q = encodeURIComponent(`${ev.venueName}, ${ev.address}, ${ev.city}`);
  const latlng = `${ev.lat},${ev.lng}`;
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${latlng}&destination_place_id=&destination_name=${q}`,
    apple: `https://maps.apple.com/?daddr=${latlng}&q=${q}`,
  };
}

const pageBg: React.CSSProperties = {
  minHeight: "100dvh",
  width: "100%",
  background: "#080c14",
};

export default function EventDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [ev, setEv] = useState<CronosEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEventById(id).then((data) => {
      setEv(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <main style={pageBg}>
        <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: "#3a5070", fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase" }}>
            Cargando…
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  if (!ev) {
    return (
      <main style={pageBg}>
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "32px 20px" }}>
          <Link href="/home" style={{ color: "#ff8c00", textDecoration: "none" }}>
            ← Volver
          </Link>
          <h1 style={{ marginTop: "16px", fontSize: "24px", fontWeight: 700, color: "#e8f0ff" }}>
            Evento no encontrado
          </h1>
          <p style={{ marginTop: "8px", color: "#c8d8f0" }}>Verifica el enlace o regresa al inicio.</p>
        </div>
        <BottomNav />
      </main>
    );
  }

  return <EventDetailsContent ev={ev} />;
}

/** Contenido con Firestore + cancelar reserva (detalles) */
function EventDetailsContent({ ev }: { ev: CronosEvent }) {
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    const auth = getAuth(firebaseApp);
    return onAuthStateChanged(auth, (u) => setUid(u ? u.uid : null));
  }, []);

  type Attendee = { id: string; team: string; name?: string; phone?: string };
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [cancelling, setCancelling] = useState(false);

  // Live attendees
  useEffect(() => {
    const db = getFirestore(firebaseApp);
    const colRef = collection(db, "events", ev.id, "attendees");
    const unsub = onSnapshot(colRef, (snap) => {
      const rows: Attendee[] = [];
      snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));
      setAttendees(rows);
    });
    return () => unsub();
  }, [ev.id]);

  const total = attendees.length;
  const aLabel = ev.split?.aLabel || ev.homeTeam || "Local";
  const bLabel = ev.split?.bLabel || ev.awayTeam || "Visitante";
  const aCount = attendees.filter((x) => x.team === aLabel).length;
  const bCount = attendees.filter((x) => x.team === bLabel).length;
  const iAmIn = uid ? attendees.some((x) => x.id === uid) : false;

  async function handleCancel() {
    if (!uid) return;
    const ok = window.confirm("¿Seguro que quieres cancelar tu reserva?");
    if (!ok) return;

    setCancelling(true);
    try {
      const db = getFirestore(firebaseApp);
      await deleteDoc(doc(db, "events", ev.id, "attendees", uid));
      alert("Tu reserva fue cancelada.");
    } catch (e: any) {
      console.error(e);
      const msg =
        e?.code === "permission-denied"
          ? "No tienes permiso para cancelar esta reserva (parece ser otro usuario/otra sesión). Inicia sesión con el mismo teléfono/cuenta que reservó."
          : "No se pudo cancelar tu reserva. Intenta de nuevo.";
      alert(msg);
    } finally {
      setCancelling(false);
    }
  }

  const links = mapsLinks(ev);

  return (
    <main style={pageBg}>
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "32px 20px" }}>
        <Link href="/home" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "16px" }}>
          <span style={{ color: "#ff8c00" }}>←</span>
          <span style={{ color: "#8899bb" }}>Volver</span>
        </Link>

        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#e8f0ff", margin: 0 }}>
          {ev.title}
        </h1>
        <div style={{ marginTop: "6px", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#ff8c00" }}>
          {ev.league}
        </div>

        <div style={{ marginTop: "12px", color: "#8899bb" }}>{fmtDateLong(ev.dateISO)}</div>
        <div style={{ marginTop: "4px", color: "#8899bb" }}>
          <span style={{ fontWeight: 600, color: "#ff8c00" }}>{ev.venueName}</span>
          <br />
          {ev.address}, {ev.city}
        </div>

        {ev?.lat && ev?.lng && !isNaN(ev.lat) && !isNaN(ev.lng) && (
          <div style={{ marginTop: "20px", overflow: "hidden", borderRadius: "16px", border: "1px solid #142035" }}>
            <MapView lat={ev.lat} lng={ev.lng} title={ev.venueName ?? ""} />
          </div>
        )}

        {/* Asistentes */}
        <div style={{
          marginTop: "24px",
          background: "#0a1220",
          border: "1px solid #142035",
          borderRadius: "16px",
          padding: "16px",
        }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#e8f0ff" }}>Asistentes</div>
          <div style={{ marginTop: "4px", fontSize: "12px", color: "#8899bb" }}>En tiempo real (Firestore)</div>

          <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", textAlign: "center" }}>
            <div style={{ background: "#0d1528", borderRadius: "12px", padding: "16px" }}>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#e8f0ff" }}>{total}</div>
              <div style={{ fontSize: "11px", color: "#8899bb", marginTop: "4px" }}>Total</div>
            </div>
            <div style={{ background: "#0d1528", borderRadius: "12px", padding: "16px" }}>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#e8f0ff" }}>{aCount}</div>
              <div style={{ fontSize: "11px", color: "#8899bb", marginTop: "4px" }}>{aLabel}</div>
            </div>
            <div style={{ background: "#0d1528", borderRadius: "12px", padding: "16px" }}>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#e8f0ff" }}>{bCount}</div>
              <div style={{ fontSize: "11px", color: "#8899bb", marginTop: "4px" }}>{bLabel}</div>
            </div>
          </div>
        </div>

        {iAmIn && (
          <div style={{ marginTop: "16px" }}>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              style={{
                width: "100%",
                background: "#0a1220",
                border: "1px solid #142035",
                borderRadius: "16px",
                padding: "14px",
                color: "rgba(232,240,255,0.5)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              {cancelling ? "Cancelando…" : "Cancelar mi reserva"}
            </button>
          </div>
        )}

        <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
          <a
            href={links.google}
            target="_blank"
            rel="noopener noreferrer"
            style={{ flex: 1, textAlign: "center", padding: "14px", borderRadius: "24px", textDecoration: "none", background: "linear-gradient(135deg, #ff6b00, #ff8c00)", color: "#fff", fontWeight: 800, border: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          >
            Google Maps
          </a>
          <a
            href={links.apple}
            target="_blank"
            rel="noopener noreferrer"
            style={{ flex: 1, textAlign: "center", padding: "14px", borderRadius: "24px", textDecoration: "none", background: "rgba(192,192,192,0.05)", border: "1px solid rgba(192,192,192,0.2)", color: "#e8f0ff", fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          >
            Apple Maps
          </a>
        </div>

        <div style={{ height: "96px" }} />
      </div>

      <BottomNav />
    </main>
  );
}
