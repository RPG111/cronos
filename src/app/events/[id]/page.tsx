// src/app/events/[id]/page.tsx
"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, use } from "react"; // 👈 agregamos use
import { EVENTS, type EventItem, fmtDateLong } from "../../../lib/events";
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

function mapsLinks(ev: EventItem) {
  const q = encodeURIComponent(`${ev.venueName}, ${ev.address}, ${ev.city}`);
  const latlng = `${ev.lat},${ev.lng}`;
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${latlng}&destination_place_id=&destination_name=${q}`,
    apple: `https://maps.apple.com/?daddr=${latlng}&q=${q}`,
  };
}

/** Envoltura: busca evento por id */
export default function EventDetails({
  params,
}: {
  params: Promise<{ id: string }>; // 👈 ahora es Promise
}) {
  const { id } = use(params); // 👈 desempaquetamos el Promise
  const ev = useMemo(() => EVENTS.find((e) => e.id === id), [id]);

  if (!ev) {
    return (
      <main>
        <div className="relative min-h-dvh w-full">
          <img
            src="/images/stadium.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
          <div className="relative z-10">
            <div className="mx-auto w-full max-w-xl px-5 py-8 text-white">
              <Link
                href="/home"
                className="text-emerald-400 hover:text-emerald-300"
              >
                ← Volver
              </Link>
              <h1 className="mt-4 text-2xl font-bold">Evento no encontrado</h1>
              <p className="mt-2 text-zinc-300">
                Verifica el enlace o regresa al inicio.
              </p>
            </div>
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  return <EventDetailsContent ev={ev} />;
}

/** Contenido con Firestore + cancelar reserva (detalles) */
function EventDetailsContent({ ev }: { ev: EventItem }) {
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    const auth = getAuth(firebaseApp);
    return onAuthStateChanged(auth, (u) => setUid(u ? u.uid : null));
  }, []);

  type Attendee = { id: string; team: string; name?: string; phone?: string };
  const [attendees, setAttendees] = useState<Attendee[]>([]);
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
  const aCount = attendees.filter((x) => x.team === ev.split.aLabel).length;
  const bCount = attendees.filter((x) => x.team === ev.split.bLabel).length;
  const iAmIn = uid ? attendees.some((x) => x.id === uid) : false;

  async function handleCancel() {
    if (!uid) return;
    try {
      const db = getFirestore(firebaseApp);
      await deleteDoc(doc(db, "events", ev.id, "attendees", uid));
    } catch (e) {
      console.error(e);
      alert("No se pudo cancelar tu reserva. Intenta de nuevo.");
    }
  }

  const links = mapsLinks(ev);

  return (
    <main>
      <div className="relative min-h-dvh w-full">
        <img
          src="/images/stadium.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

        <div className="relative z-10">
          <div className="mx-auto w-full max-w-xl px-5 py-8">
            <Link
              href="/home"
              className="mb-4 inline-flex items-center text-emerald-400 hover:text-emerald-300"
            >
              ← Volver
            </Link>

            <h1 className="text-3xl font-extrabold text-white">{ev.title}</h1>
            <div className="mt-1 text-sm uppercase tracking-widest text-zinc-400">
              {ev.league}
            </div>

            <div className="mt-3 text-zinc-300">{fmtDateLong(ev.dateISO)}</div>
            <div className="mt-1 text-zinc-300">
              <span className="font-semibold">{ev.venueName}</span>
              <br />
              {ev.address}, {ev.city}
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
              <MapView lat={ev.lat} lng={ev.lng} title={ev.venueName} />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/50 p-4">
              <div className="text-lg font-bold text-white">Asistentes</div>
              <div className="mt-1 text-zinc-400 text-sm">
                En tiempo real (Firestore)
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-zinc-800 p-4 text-white">
                  <div className="text-2xl font-extrabold">{total}</div>
                  <div className="text-xs text-zinc-300">Total</div>
                </div>
                <div className="rounded-xl bg-zinc-800 p-4 text-white">
                  <div className="text-2xl font-extrabold">{aCount}</div>
                  <div className="text-xs text-zinc-300">{ev.split.aLabel}</div>
                </div>
                <div className="rounded-xl bg-zinc-800 p-4 text-white">
                  <div className="text-2xl font-extrabold">{bCount}</div>
                  <div className="text-xs text-zinc-300">{ev.split.bLabel}</div>
                </div>
              </div>
            </div>

            {iAmIn && (
              <div className="mt-4">
                <button
                  onClick={handleCancel}
                  className="w-full rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-3 font-semibold text-red-200 hover:bg-red-500/30 transition"
                >
                  Cancelar mi reserva
                </button>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <a
                className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-center font-semibold text-white transition hover:bg-emerald-600"
                href={links.google}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir en Google Maps
              </a>
              <a
                className="flex-1 rounded-xl border border-white/15 bg-zinc-800 px-4 py-3 text-center text-white transition hover:bg-zinc-700"
                href={links.apple}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir en Apple Maps
              </a>
            </div>

            <div className="h-24" />
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
