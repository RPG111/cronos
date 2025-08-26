// src/app/picks/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import BottomNav from "../../components/BottomNav";
import { EVENTS, type EventItem, fmtDateShort } from "../../lib/events";
import { app as firebaseApp } from "../../lib/firebase";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

/* Modal simple */
function Modal({ open, onClose, title, children }:{
  open:boolean; onClose:()=>void; title:string; children:React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-[92%] max-w-md rounded-2xl border border-white/10 bg-zinc-900/95 p-5 text-white shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-lg bg-zinc-800 px-2 py-1 text-sm hover:bg-zinc-700">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function PicksPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    return onAuthStateChanged(auth, (u) => {
      if (!u) router.replace("/auth/login");
      else setUid(u.uid);
    });
  }, [router]);

 // Evento destacado (sin usar x.sport, que NO existe en EventItem)
const event: EventItem | undefined = useMemo(() => {
  const e = EVENTS.find(x => x.league?.toLowerCase?.() !== "boxeo");
  return e ?? EVENTS[0];
}, []);


  const [winner, setWinner] = useState("");
  const [goals, setGoals] = useState<string | number>("");
  const [scorer, setScorer] = useState("");
  const [loadingPick, setLoadingPick] = useState(true);
  const [hasPick, setHasPick] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!event || !uid) { setHasPick(false); setLoadingPick(false); return; }
      setLoadingPick(true);
      const db = getFirestore(firebaseApp);
      const ref = doc(db, "events", event.id, "picks", uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data() as any;
        setWinner(d.winner || "");
        setGoals(d.goals ?? "");
        setScorer(d.scorer || "");
        setHasPick(true);
      } else setHasPick(false);
      setLoadingPick(false);
    })();
  }, [event, uid]);

  function handleOpen() {
    if (!uid) return;
    setOpen(true);
  }

  async function handleSave() {
    if (!uid || !event) return;
    if (!winner.trim() || !scorer.trim() || (goals === "" || goals === null)) {
      alert("Responde las tres preguntas."); return;
    }
    setSaving(true);
    try {
      const db = getFirestore(firebaseApp);
      await setDoc(
        doc(db, "events", event.id, "picks", uid),
        {
          winner: winner.trim(),
          goals: typeof goals === "string" && goals.trim() !== "" && !Number.isNaN(Number(goals))
            ? Number(goals) : goals,
          scorer: scorer.trim(),
          ts: serverTimestamp(),
        },
        { merge: true }
      );
      setHasPick(true); setOpen(false);
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar tu quiniela.");
    } finally {
      setSaving(false);
    }
  }

  if (!event) {
    return (
      <main>
        <div className="relative min-h-dvh w-full">
          <img src="/images/stadium.jpg" alt="" className="absolute inset-0 h-full w-full object-cover blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
          <div className="relative z-10">
            <div className="mx-auto w-full max-w-xl px-5 py-8">
              <h1 className="text-3xl font-extrabold text-white">Quinielas</h1>
              <p className="mt-2 text-zinc-300">No hay evento disponible por ahora.</p>
              <div className="h-24" />
            </div>
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main>
      <div className="relative min-h-dvh w-full">
        <img src="/images/stadium.jpg" alt="" className="absolute inset-0 h-full w-full object-cover blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

        <div className="relative z-10">
          <div className="mx-auto w-full max-w-xl px-5 py-8">
            <h1 className="text-3xl font-extrabold text-white">Quinielas</h1>
            <p className="mt-2 text-zinc-300">Participa con tus predicciones para el partido activo.</p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-zinc-400">{event.league}</div>
                  <div className="mt-1 text-xl font-bold text-white">{event.title}</div>
                </div>
                <div className="text-right text-sm text-zinc-300">
                  <div className="font-medium">{event.venueName}</div>
                  <div className="text-zinc-400">{event.address}<br />{event.city}</div>
                </div>
              </div>
              <div className="mt-2 text-sm text-zinc-300">{fmtDateShort(event.dateISO)}</div>

              {!loadingPick && (
                <div className="mt-4">
                  <button onClick={handleOpen} className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white hover:bg-emerald-600 transition">
                    {hasPick ? "Editar mi quiniela" : "Participar en quiniela"}
                  </button>
                  {hasPick && (
                    <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-200">
                      <div className="text-sm font-semibold text-emerald-300">Tu quiniela</div>
                      <div className="mt-2 grid grid-cols-1 gap-1 text-sm">
                        <div><span className="text-emerald-400">Ganador:</span> {winner || "—"}</div>
                        <div><span className="text-emerald-400">Número de goles:</span> {String(goals ?? "—")}</div>
                        <div><span className="text-emerald-400">Goleador:</span> {scorer || "—"}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="h-24" />
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Participar en quiniela">
        <div className="space-y-4">
          <div>
            <label className="block text-xs tracking-widest text-white/70">GANADOR</label>
            <input value={winner} onChange={(e) => setWinner(e.target.value)} placeholder="Ej. México"
                   className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 text-white outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-xs tracking-widest text-white/70">NÚMERO DE GOLES</label>
            <input value={String(goals)} onChange={(e) => setGoals(e.target.value)} placeholder="Ej. 3" inputMode="numeric"
                   className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 text-white outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-xs tracking-widest text-white/70">GOLEADOR</label>
            <input value={scorer} onChange={(e) => setScorer(e.target.value)} placeholder="Ej. Santi Giménez"
                   className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 text-white outline-none focus:border-emerald-500" />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-white/15 bg-zinc-800 px-4 py-3 text-white hover:bg-zinc-700 transition" disabled={saving}>
              Cancelar
            </button>
            <button onClick={handleSave} className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white hover:bg-emerald-600 transition disabled:opacity-60" disabled={saving}>
              {saving ? "Guardando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </Modal>

      <BottomNav />
    </main>
  );
}
