// src/app/home/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fmtDateShort } from "../../lib/events";
import { subscribeToEvents, type CronosEvent } from "../../lib/firestore/events";
import { app as firebaseApp } from "../../lib/firebase";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  onSnapshot as onDocSnapshot,
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInAnonymously,
} from "firebase/auth";
import BottomNav from "../../components/BottomNav";
import Header from "@/components/Header";
import RestaurantLead from "@/components/RestaurantLead";
import TeamsAutocomplete from "@/components/TeamsAutocomplete";
import QRModal, { type QRData } from "@/components/QRModal";

/* Modal simple reutilizable */
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
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

/** 🔠 Util: genera un slug estable para IDs (equipo → teams/{slug}) */
function slugifyName(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Counts = { total: number; a: number; b: number };
type CountsMap = Record<string, Counts>;
type MyAttendanceMap = Record<string, { team: string; reserveCode?: string; name?: string } | null>;

export default function HomePage() {
  const [events, setEvents] = useState<CronosEvent[]>([]);
  const [counts, setCounts] = useState<CountsMap>({});
  const [uid, setUid] = useState<string | null>(null);

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileFav, setProfileFav] = useState(""); // equipo favorito guardado

  const [myAttendance, setMyAttendance] = useState<MyAttendanceMap>({});

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CronosEvent | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [teamChoice, setTeamChoice] = useState<"A" | "B" | null>(null);
  const [saving, setSaving] = useState(false);

  // Modal “Soy restaurante”
  const [leadOpen, setLeadOpen] = useState(false);

  // Modal QR
  const [qrOpen, setQrOpen] = useState(false);
  const [qrData, setQrData] = useState<QRData | null>(null);

  // 🔵 Segundo modal para pedir equipo favorito si el usuario no tiene cuenta
  const [favOpen, setFavOpen] = useState(false);
  const [favTeam, setFavTeam] = useState("");

  // 🔁 Guarda o actualiza un equipo libre en la colección `teams`
  async function upsertTeamIfNew(nameRaw: string) {
    const name = (nameRaw || "").trim();
    if (!name) return;
    const db = getFirestore(firebaseApp);
    const slug = slugifyName(name);
    try {
      await setDoc(
        doc(db, "teams", slug),
        {
          name,
          slug,
          source: "user_input",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error("No se pudo guardar equipo:", e);
    }
  }

  useEffect(() => {
    return subscribeToEvents(setEvents);
  }, []);

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUid(u ? u.uid : null);

      if (u) {
        try {
          const db = getFirestore(firebaseApp);
          const userDoc = await getDoc(doc(db, "users", u.uid));
          if (userDoc.exists()) {
            const d = userDoc.data() as any;
            setProfileName((d?.name as string) || u.displayName || "");
            setProfilePhone((d?.phone as string) || (u.phoneNumber ?? ""));
            setProfileFav((d?.favoriteTeam as string) || "");
            return;
          }
        } catch {}
        setProfileName(u.displayName || "");
        setProfilePhone(u.phoneNumber || "");
        setProfileFav("");
      } else {
        setProfileName("");
        setProfilePhone("");
        setProfileFav("");
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    const unsubs: Array<() => void> = [];
    events.forEach((ev) => {
      const colRef = collection(db, "events", ev.id, "attendees");
      const unsub = onSnapshot(colRef, (snap) => {
        let total = 0, a = 0, b = 0;
        snap.forEach((d) => {
          total += 1;
          const team = (d.data().team as string) || "";
          if (team === ev.split.aLabel) a += 1;
          else if (team === ev.split.bLabel) b += 1;
        });
        setCounts((prev) => ({ ...prev, [ev.id]: { total, a, b } }));
      });
      unsubs.push(unsub);
    });
    return () => unsubs.forEach((u) => u());
  }, [events]);

  useEffect(() => {
    if (!uid) { setMyAttendance({}); return; }
    const db = getFirestore(firebaseApp);
    const unsubs: Array<() => void> = [];
    events.forEach((ev) => {
      const myDocRef = doc(db, "events", ev.id, "attendees", uid);
      const unsub = onDocSnapshot(myDocRef, (d) => {
        setMyAttendance((prev) => ({
          ...prev,
          [ev.id]: d.exists()
            ? {
                team: (d.data()?.team as string) || "",
                reserveCode: (d.data()?.reserveCode as string) || undefined,
                name: (d.data()?.name as string) || undefined,
              }
            : null,
        }));
      });
      unsubs.push(unsub);
    });
    return () => unsubs.forEach((u) => u());
  }, [events, uid]);

  function openReserveModal(ev: CronosEvent) {
    setSelected(ev);
    setName(profileName);
    setPhone(profilePhone);
    const mine = myAttendance[ev.id];
    if (mine?.team === ev.split?.aLabel) setTeamChoice("A");
    else if (mine?.team === ev.split?.bLabel) setTeamChoice("B");
    else setTeamChoice(null);
    setOpen(true);
  }

  function genCode6() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async function createOrUpdateProfileAndReserve(activeUid: string) {
    if (!selected) return;
    const db = getFirestore(firebaseApp);
    const team = teamChoice === "A" ? selected.split?.aLabel : selected.split?.bLabel;
    const reserveCode = genCode6();

    // Perfil (incluye favoriteTeam si lo tenemos)
    await setDoc(
      doc(db, "users", activeUid),
      {
        name: name.trim(),
        phone: phone.trim(),
        favoriteTeam: (profileFav || favTeam || "").trim(),
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Asistencia
    await setDoc(
      doc(db, "events", selected.id, "attendees", activeUid),
      {
        team,
        name: name.trim(),
        phone: phone.trim(),
        ts: serverTimestamp(),
        reserveCode,
        codeSentAt: serverTimestamp(),
        smsStatus: "sent",
      },
      { merge: true }
    );

    // SMS
    await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: phone.trim(),
        message: `Cronos: tu código de reserva para "${selected.title}" es ${reserveCode}.`,
      }),
    });
  }

  async function confirmReserve() {
    if (!selected) return;
    if (!teamChoice) { alert("Elige un bando para continuar."); return; }
    if (!name.trim() || !phone.trim()) { alert("Confirma nombre y teléfono."); return; }

    // Validación de cupo (solo si no tiene ya reserva en este evento)
    const currentCount = counts[selected.id];
    if (!myAttendance[selected.id] && currentCount && currentCount.total >= selected.capacity) {
      alert("Lo sentimos, este evento ya está lleno.");
      return;
    }

    // Caso 1: el usuario YA está logueado → reservar directo
    if (uid) {
      setSaving(true);
      try {
        await createOrUpdateProfileAndReserve(uid);
        setOpen(false);
        alert("Reserva confirmada. Te enviamos tu código por SMS.");
      } catch (e) {
        console.error(e);
        alert("No se pudo guardar/enviar tu reserva. Intenta de nuevo.");
      } finally {
        setSaving(false);
      }
      return;
    }

    // Caso 2: NO hay sesión → pedimos equipo favorito (si no lo tenemos)
    setFavOpen(true);
  }

  // 🔧 AJUSTADO: primero sesión (anónima si hace falta), luego teams, luego perfil+reserva
  async function handleFavSubmit() {
    if (!favTeam.trim()) {
      alert("Selecciona o escribe tu equipo favorito.");
      return;
    }
    setSaving(true);
    try {
      const auth = getAuth(firebaseApp);

      // 1) Asegura sesión
      let activeUid = uid;
      if (!activeUid) {
        const cred = await signInAnonymously(auth);
        activeUid = cred.user?.uid || null;
        if (!activeUid) throw new Error("No se pudo iniciar sesión anónima.");
      }

      // 2) Ahora sí: guardar/actualizar el equipo en 'teams' (ya autenticado)
      await upsertTeamIfNew(favTeam);

      // 3) Perfil + reserva + SMS
      await createOrUpdateProfileAndReserve(activeUid);

      setFavOpen(false);
      setOpen(false);
      alert("Reserva confirmada. Te enviamos tu código por SMS.");
    } catch (e) {
      console.error(e);
      alert("No se pudo terminar la reserva. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut(getAuth(firebaseApp));
      window.location.href = "/auth/login";
    } catch (e) {
      console.error(e);
      alert("No se pudo cerrar sesión.");
    }
  }

  return (
    <main>
      <div className="relative min-h-dvh w-full">
        <img src="/images/stadium.jpg" alt="" className="absolute inset-0 h-full w-full object-cover blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

        <div className="relative z-10">
          {/* Header */}
          <Header
            onOpenLead={() => setLeadOpen(true)}
            isLoggedIn={!!uid}
            onLogout={handleSignOut}
          />

          {/* Modal “Soy restaurante” */}
          <RestaurantLead open={leadOpen} onClose={() => setLeadOpen(false)} />

          <div className="mx-auto w-full max-w-xl px-5 py-6">
            <h2 className="text-4xl font-extrabold tracking-tight text-white">Próximos eventos</h2>
            <p className="mt-2 text-zinc-300">Elige un lugar para ver tu próximo evento.</p>

            <div className="mt-6 space-y-5">
              {events.map((ev) => {
                const c = counts[ev.id] || { total: ev.attendees ?? 0, a: ev.split?.aCount ?? 0, b: ev.split?.bCount ?? 0 };
                const mine = myAttendance[ev.id];
                const going = !!mine;
                const myLabel =
                  mine?.team === ev.split?.aLabel ? ev.split?.aLabel :
                  mine?.team === ev.split?.bLabel ? ev.split?.bLabel : null;
                const remaining = ev.capacity - c.total;
                const isFull = c.total >= ev.capacity;
                const isUrgent = !isFull && remaining <= 3;

                return (
                  <div key={ev.id} className="rounded-2xl border border-white/10 bg-black/50 p-4 shadow-xl backdrop-blur-md">
                    <div className="flex items-start justify-between">
                      <div className="pr-3">
                        <div className="text-xs uppercase tracking-widest text-zinc-400">{ev.league}</div>
                        <div className="mt-1 text-xl font-bold text-white">{ev.title}</div>
                        {going && myLabel && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                              Vas — {myLabel}
                            </span>
                            {mine?.reserveCode && (
                              <button
                                onClick={() => {
                                  setQrData({
                                    code: mine.reserveCode!,
                                    eventTitle: ev.title,
                                    userName: mine.name || profileName || undefined,
                                    team: myLabel,
                                  });
                                  setQrOpen(true);
                                }}
                                className="rounded-full border border-white/20 bg-zinc-800/70 px-2 py-1 text-xs text-white hover:bg-zinc-700 transition"
                              >
                                Ver QR
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm text-zinc-300">
                        <div className="font-medium">{ev.venueName}</div>
                        <div className="text-zinc-400">{ev.address}<br />{ev.city}</div>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-zinc-300">{fmtDateShort(ev.dateISO)}</div>

                    <div className={`mt-1 text-xs font-medium ${isFull ? "text-red-400" : isUrgent ? "text-amber-400" : "text-zinc-400"}`}>
                      {c.total} / {ev.capacity} lugares{isFull ? " — Lleno" : isUrgent ? " — ¡Últimos lugares!" : ""}
                    </div>

                    {/* Contadores */}
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-zinc-800/70 p-2 text-white">
                        <div className="text-lg font-bold">{c.total}</div>
                        <div className="text-[11px] text-zinc-300">Total</div>
                      </div>
                      <div className="rounded-lg bg-zinc-800/70 p-2 text-white">
                        <div className="text-lg font-bold">{c.a}</div>
                        <div className="text-[11px] text-zinc-300">{ev.split?.aLabel}</div>
                      </div>
                      <div className="rounded-lg bg-zinc-800/70 p-2 text-white">
                        <div className="text-lg font-bold">{c.b}</div>
                        <div className="text-[11px] text-zinc-300">{ev.split?.bLabel}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => openReserveModal(ev)}
                        disabled={isFull && !going}
                        className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-center font-semibold text-white hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {going ? "Editar reserva" : isFull ? "Evento lleno" : "Reservar"}
                      </button>
                      <Link
                        href={`/events/${ev.id}`}
                        className="rounded-xl border border-white/15 bg-zinc-800 px-4 py-3 text-white hover:bg-zinc-700 transition"
                      >
                        Detalles
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="h-24" />
          </div>
        </div>
      </div>

      {/* Modal reserva */}
      <Modal open={open} onClose={() => setOpen(false)} title={selected ? `Confirmar reserva — ${selected.title}` : "Confirmar reserva"}>
        {selected && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs tracking-widest text-white/70">NOMBRE</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre"
                     className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 text-white outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs tracking-widest text-white/70">TELÉFONO</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 415 555 1234"
                     className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 text-white outline-none focus:border-emerald-500" />
            </div>

            <div>
              <span className="block text-xs tracking-widest text-white/70">BANDO</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800/60 p-3">
                  <input type="radio" name="teamHome" checked={teamChoice === "A"} onChange={() => setTeamChoice("A")} />
                  <span>{selected?.split?.aLabel}</span>
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800/60 p-3">
                  <input type="radio" name="teamHome" checked={teamChoice === "B"} onChange={() => setTeamChoice("B")} />
                  <span>{selected?.split?.bLabel}</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-white/15 bg-zinc-800 px-4 py-3 text-white hover:bg-zinc-700 transition" disabled={saving}>
                Cancelar
              </button>
              <button onClick={confirmReserve} className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white hover:bg-emerald-600 transition disabled:opacity-60" disabled={saving}>
                {saving ? "Guardando..." : "Confirmar reserva"}
              </button>
            </div>

            <p className="pt-1 text-center text-xs text-white/60">* Te enviaremos tu código de reserva por SMS.</p>
          </div>
        )}
      </Modal>

      {/* Modal equipo favorito (solo si no hay sesión) */}
      <Modal open={favOpen} onClose={() => setFavOpen(false)} title="Tu equipo favorito">
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Para completar tu reserva, dinos cuál es tu <strong>equipo favorito</strong>.
          </p>
          <TeamsAutocomplete value={favTeam} onChange={setFavTeam} />
          <div className="flex gap-3 pt-2">
            <button onClick={() => setFavOpen(false)} className="flex-1 rounded-xl border border-white/15 bg-zinc-800 px-4 py-3 text-white hover:bg-zinc-700 transition" disabled={saving}>
              Atrás
            </button>
            <button onClick={handleFavSubmit} className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white hover:bg-emerald-600 transition disabled:opacity-60" disabled={saving}>
              {saving ? "Guardando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </Modal>

      <QRModal open={qrOpen} onClose={() => setQrOpen(false)} data={qrData} />

      <BottomNav />
    </main>
  );
}
