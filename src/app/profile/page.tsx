// src/app/profile/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app as firebaseApp } from "../../lib/firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import BottomNav from "../../components/BottomNav";
import { EVENTS, type EventItem, fmtDateShort } from "../../lib/events";
import { useRouter } from "next/navigation";

type MyRes = { event: EventItem; team: string; name?: string; phone?: string; };

export default function ProfilePage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MyRes[]>([]);
  const events = useMemo(() => EVENTS, []);

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
          out.push({ event: ev, team: d.team as string, name: d.name, phone: d.phone });
        }
      }
      setItems(out); setLoading(false);
    })();
  }, [uid, events]);

  return (
    <main>
      <div className="relative min-h-dvh w-full">
        <img src="/images/stadium.jpg" alt="" className="absolute inset-0 h-full w-full object-cover blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        <div className="relative z-10">
          <div className="mx-auto w-full max-w-xl px-5 py-8">
            <h1 className="text-3xl font-extrabold text-white">Mi perfil</h1>
            <p className="mt-2 text-zinc-300">Tus reservas confirmadas.</p>

            <div className="mt-6 space-y-4">
              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-black/50 p-4 text-zinc-300">Cargando…</div>
              ) : items.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/50 p-4 text-zinc-300">Aún no tienes reservas.</div>
              ) : (
                items.map((it) => (
                  <div key={it.event.id} className="rounded-2xl border border-white/10 bg-black/50 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-widest text-zinc-400">{it.event.league}</div>
                        <div className="mt-1 text-xl font-bold text-white">{it.event.title}</div>
                        <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                          Vas — {it.team}
                        </span>
                      </div>
                      <div className="text-right text-sm text-zinc-300">
                        <div className="font-medium">{it.event.venueName}</div>
                        <div className="text-zinc-400">{it.event.address}<br />{it.event.city}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-zinc-300">{fmtDateShort(it.event.dateISO)}</div>
                    <div className="mt-3 flex gap-3">
                      <Link href={`/events/${it.event.id}`} className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-center font-semibold text-white hover:bg-emerald-600 transition">
                        Ver / Cancelar
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="h-24" />
          </div>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
