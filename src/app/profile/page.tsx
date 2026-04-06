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
import { useRouter } from "next/navigation";
import QRModal, { type QRData } from "../../components/QRModal";

type MyRes = { event: CronosEvent; team: string; name?: string; phone?: string; reserveCode?: string; };

export default function ProfilePage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MyRes[]>([]);
  const [events, setEvents] = useState<CronosEvent[]>([]);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrData, setQrData] = useState<QRData | null>(null);

  useEffect(() => {
    getPublishedEvents().then(setEvents);
  }, []);

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    return onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.replace("/auth/login");
      } else {
        setUid(u.uid);
      }
    });
  }, [router]);

  useEffect(() => {
    if (!uid) { setItems([]); setLoading(false); return; }
    (async () => {
      setLoading(true);
      const db = getFirestore(firebaseApp);
      const out: MyRes[] = [];
      for (const ev of events) {
        const snap = await getDoc(doc(db, "events", ev.id, "attendees", uid));
        if (snap.exists()) {
          const d = snap.data() as any;
          out.push({ event: ev, team: d.team as string, name: d.name, phone: d.phone, reserveCode: d.reserveCode });
        }
      }
      setItems(out); setLoading(false);
    })();
  }, [uid, events]);

  return (
    <main style={{ minHeight: "100dvh", background: "#080c14" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "32px 20px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#e8f0ff", margin: 0 }}>Mi perfil</h1>
        <p style={{ marginTop: "6px", color: "#8899bb", fontSize: "13px" }}>Tus reservas confirmadas.</p>

        <div style={{ marginTop: "24px", display: "grid", gap: "12px" }}>
          {loading ? (
            <div style={{ background: "#0a1220", border: "1px solid #142035", borderRadius: "16px", padding: "16px", color: "#8899bb", fontSize: "13px" }}>Cargando…</div>
          ) : items.length === 0 ? (
            <div style={{ background: "#0a1220", border: "1px solid #142035", borderRadius: "16px", padding: "16px", color: "#8899bb", fontSize: "13px" }}>Aún no tienes reservas.</div>
          ) : (
            items.map((it) => (
              <div key={it.event.id} className="card-chrome-wrap">
                <div style={{ background: "#0a1220", borderRadius: "18px", padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                    <div>
                      <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#ff8c00", fontWeight: 700, textTransform: "uppercase" }}>{it.event.league}</div>
                      <div style={{ marginTop: "4px", fontSize: "18px", fontWeight: 700, color: "#e8f0ff" }}>{it.event.title}</div>
                      <span style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,140,0,0.12)", border: "1px solid rgba(255,140,0,0.3)", color: "#ff8c00", fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px" }}>
                        Vas — {it.team}
                      </span>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#ff8c00" }}>{it.event.venueName}</div>
                      <div style={{ fontSize: "11px", color: "#8899bb", marginTop: "2px" }}>{it.event.address}<br />{it.event.city}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: "10px", fontSize: "12px", color: "#8899bb" }}>{fmtDateShort(it.event.dateISO)}</div>
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
        </div>

        <div style={{ height: "96px" }} />
      </div>
      <QRModal open={qrOpen} onClose={() => setQrOpen(false)} data={qrData} />
      <BottomNav />
    </main>
  );
}
