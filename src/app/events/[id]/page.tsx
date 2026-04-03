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
          <Link href="/home" style={{ color: "#00c9ff", textDecoration: "none" }}>
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
        <Link
          href="/home"
          style={{ color: "#00c9ff", textDecoration: "none", display: "inline-flex", alignItems: "center", marginBottom: "16px" }}
        >
          ← Volver
        </Link>

        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#e8f0ff", margin: 0 }}>
          {ev.title}
        </h1>
        <div style={{ marginTop: "6px", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#00c9ff" }}>
          {ev.league}
        </div>

        <div style={{ marginTop: "12px", color: "#c8d8f0" }}>{fmtDateLong(ev.dateISO)}</div>
        <div style={{ marginTop: "4px", color: "#c8d8f0" }}>
          <span style={{ fontWeight: 600 }}>{ev.venueName}</span>
          <br />
          {ev.address}, {ev.city}
        </div>

        {ev.lat && ev.lng && (
          <div style={{ marginTop: "20px", overflow: "hidden", borderRadius: "16px", border: "1px solid #142035" }}>
            <MapView lat={ev.lat} lng={ev.lng} title={ev.venueName} />
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
          <div style={{ marginTop: "4px", fontSize: "12px", color: "#3a5070" }}>En tiempo real (Firestore)</div>

          <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", textAlign: "center" }}>
            <div style={{ background: "#0d1528", borderRadius: "12px", padding: "16px" }}>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#e8f0ff" }}>{total}</div>
              <div style={{ fontSize: "11px", color: "#3a5070", marginTop: "4px" }}>Total</div>
            </div>
            <div style={{ background: "#0d1528", borderRadius: "12px", padding: "16px" }}>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#00ff9d" }}>{aCount}</div>
              <div style={{ fontSize: "11px", color: "#3a5070", marginTop: "4px" }}>{aLabel}</div>
            </div>
            <div style={{ background: "#0d1528", borderRadius: "12px", padding: "16px" }}>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#00c9ff" }}>{bCount}</div>
              <div style={{ fontSize: "11px", color: "#3a5070", marginTop: "4px" }}>{bLabel}</div>
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
                borderRadius: "14px",
                border: "1px solid rgba(255,60,60,0.3)",
                background: "rgba(255,60,60,0.15)",
                padding: "12px",
                fontWeight: 600,
                color: "#ff6b6b",
                cursor: "pointer",
                opacity: cancelling ? 0.6 : 1,
              }}
            >
              {cancelling ? "Cancelando…" : "Cancelar mi reserva"}
            </button>
            <p style={{ marginTop: "8px", textAlign: "center", fontSize: "11px", color: "#3a5070" }}>
              * Solo puedes cancelar la reserva creada con esta misma sesión/cuenta.
            </p>
          </div>
        )}

        <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
          <a
            className="btn-primary-cronos"
            href={links.google}
            target="_blank"
            rel="noopener noreferrer"
            style={{ flex: 1, textAlign: "center", padding: "12px", borderRadius: "14px", textDecoration: "none" }}
          >
            Google Maps
          </a>
          <a
            className="btn-ghost-cronos"
            href={links.apple}
            target="_blank"
            rel="noopener noreferrer"
            style={{ flex: 1, textAlign: "center", padding: "12px", borderRadius: "14px", textDecoration: "none" }}
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
