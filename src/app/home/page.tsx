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
          <button onClick={onClose} className="rounded-lg bg-zinc-800 px-2 py-1 text-sm hover:bg-zinc-700">&#x2715;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Util: genera un slug estable para IDs (equipo -> teams/{slug}) */
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
  const [profileFav, setProfileFav] = useState("");

  const [myAttendance, setMyAttendance] = useState<MyAttendanceMap>({});

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CronosEvent | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [teamChoice, setTeamChoice] = useState<"A" | "B" | null>(null);
  const [saving, setSaving] = useState(false);

  const [leadOpen, setLeadOpen] = useState(false);

  const [qrOpen, setQrOpen] = useState(false);
  const [qrData, setQrData] = useState<QRData | null>(null);

  const [favOpen, setFavOpen] = useState(false);
  const [favTeam, setFavTeam] = useState("");

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
          if (team === (ev.split?.aLabel || ev.homeTeam)) a += 1;
          else if (team === (ev.split?.bLabel || ev.awayTeam)) b += 1;
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
    const team = teamChoice === "A"
      ? (selected.split?.aLabel || selected.homeTeam || "")
      : (selected.split?.bLabel || selected.awayTeam || "");
    const reserveCode = genCode6();

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

    await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: phone.trim(),
        message: "Cronos: tu codigo de reserva para \"" + selected.title + "\" es " + reserveCode + ".",
      }),
    });
  }

  async function confirmReserve() {
    if (!selected) return;
    if (!teamChoice) { alert("Elige un bando para continuar."); return; }
    if (!name.trim() || !phone.trim()) { alert("Confirma nombre y telefono."); return; }

    const currentCount = counts[selected.id];
    if (!myAttendance[selected.id] && currentCount && currentCount.total >= selected.capacity) {
      alert("Lo sentimos, este evento ya esta lleno.");
      return;
    }

    if (uid) {
      setSaving(true);
      try {
        await createOrUpdateProfileAndReserve(uid);
        setOpen(false);
        alert("Reserva confirmada. Te enviamos tu codigo por SMS.");
      } catch (e) {
        console.error(e);
        alert("No se pudo guardar/enviar tu reserva. Intenta de nuevo.");
      } finally {
        setSaving(false);
      }
      return;
    }

    setFavOpen(true);
  }

  async function handleFavSubmit() {
    if (!favTeam.trim()) {
      alert("Selecciona o escribe tu equipo favorito.");
      return;
    }
    setSaving(true);
    try {
      const auth = getAuth(firebaseApp);

      let activeUid = uid;
      if (!activeUid) {
        const cred = await signInAnonymously(auth);
        activeUid = cred.user?.uid || null;
        if (!activeUid) throw new Error("No se pudo iniciar sesion anonima.");
      }

      await upsertTeamIfNew(favTeam);
      await createOrUpdateProfileAndReserve(activeUid);

      setFavOpen(false);
      setOpen(false);
      alert("Reserva confirmada. Te enviamos tu codigo por SMS.");
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
      alert("No se pudo cerrar sesion.");
    }
  }

  return (
    <main style={{ minHeight: "100dvh", background: "#080c14" }}>
      <Header
        onOpenLead={() => setLeadOpen(true)}
        isLoggedIn={!!uid}
        onLogout={handleSignOut}
      />

      <RestaurantLead open={leadOpen} onClose={() => setLeadOpen(false)} />

      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "24px 16px" }}>
        <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#e8f0ff", margin: 0 }}>
          Proximos eventos
        </h2>
        <p style={{ color: "#3a5070", marginTop: "4px", fontSize: "13px" }}>
          Elige un lugar para ver tu proximo evento.
        </p>

        <div style={{ marginTop: "20px" }}>
          {events.map((ev) => {
            const c = counts[ev.id] || { total: ev.attendees ?? 0, a: ev.split?.aCount ?? 0, b: ev.split?.bCount ?? 0 };
            const mine = myAttendance[ev.id];
            const going = !!mine;
            const myLabel =
              mine?.team === ev.split?.aLabel ? ev.split?.aLabel :
              mine?.team === ev.split?.bLabel ? ev.split?.bLabel : null;
            const remaining = ev.capacity - c.total;
            const isFull = c.total >= ev.capacity;

            return (
              <div
                key={ev.id}
                style={{
                  background: "#0a1220",
                  border: "1px solid #142035",
                  borderRadius: "18px",
                  overflow: "hidden",
                  marginBottom: "12px",
                }}
              >
                {/* Top: liga + venue pill */}
                <div style={{ padding: "14px 14px 8px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#00c9ff", fontWeight: 700, textTransform: "uppercase" }}>
                    {ev.league}
                  </div>
                  <div style={{ background: "#0d1528", border: "1px solid #142035", borderRadius: "10px", padding: "4px 10px", textAlign: "right" }}>
                    <div style={{ color: "#00c9ff", fontSize: "12px", fontWeight: 600 }}>{ev.venueName}</div>
                    <div style={{ color: "#3a5070", fontSize: "10px" }}>{ev.city}</div>
                  </div>
                </div>

                {/* Titulo */}
                <div style={{ fontSize: "17px", fontWeight: 700, color: "#e8f0ff", padding: "0 14px 10px" }}>
                  {ev.title}
                </div>

                {/* Badge going + Ver QR */}
                {going && myLabel && (
                  <div style={{ padding: "0 14px 8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ background: "rgba(0,255,157,0.08)", border: "1px solid rgba(0,255,157,0.25)", color: "#00ff9d", fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px" }}>
                      Vas &mdash; {myLabel}
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
                        style={{ background: "#0d1528", border: "1px solid #1e3050", color: "#c8d8f0", fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", cursor: "pointer" }}
                      >
                        Ver QR
                      </button>
                    )}
                  </div>
                )}

                {/* Fecha */}
                <div style={{ fontSize: "11px", color: "#3a5070", padding: "0 14px 8px" }}>
                  {fmtDateShort(ev.dateISO)}
                </div>

                {/* Barra de capacidad */}
                <div style={{ margin: "0 14px 4px", background: "#0d1a2e", borderRadius: "3px", height: "3px" }}>
                  <div style={{
                    background: "linear-gradient(90deg, #00ff9d, #00c9ff)",
                    width: Math.min((c.total / ev.capacity) * 100, 100) + "%",
                    height: "100%",
                    borderRadius: "3px",
                  }} />
                </div>

                {/* Texto capacidad */}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 14px 10px" }}>
                  <span style={{ color: "#3a5070", fontSize: "11px" }}>{c.total} / {ev.capacity} lugares</span>
                  {isFull ? (
                    <span style={{ color: "#3a5070", fontSize: "11px" }}>Lleno</span>
                  ) : remaining <= 5 ? (
                    <span style={{ color: "#00ff9d", fontSize: "11px" }}>{remaining} restantes</span>
                  ) : (
                    <span style={{ color: "#3a5070", fontSize: "11px" }}>Disponible</span>
                  )}
                </div>

                {/* Contadores de equipos */}
                {(() => {
                  const aLabel = ev.split?.aLabel || ev.homeTeam || "Local";
                  const bLabel = ev.split?.bLabel || ev.awayTeam || "Visitante";
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 32px 1fr", alignItems: "center", padding: "10px 14px", borderTop: "1px solid #142035" }}>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ color: "#c8d8f0", fontSize: "12px" }}>{aLabel}</div>
                        <div style={{ color: "#00ff9d", fontSize: "22px", fontWeight: 700 }}>{c.a}</div>
                      </div>
                      <div style={{ textAlign: "center", color: "#2a3a50", fontSize: "10px", fontWeight: 700 }}>VS</div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#c8d8f0", fontSize: "12px" }}>{bLabel}</div>
                        <div style={{ color: "#00c9ff", fontSize: "22px", fontWeight: 700 }}>{c.b}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Botones */}
                <div style={{ display: "flex", gap: "8px", padding: "0 14px 14px" }}>
                  <button
                    onClick={() => {
                      if (going && mine?.reserveCode) {
                        setQrData({
                          code: mine.reserveCode!,
                          eventTitle: ev.title,
                          userName: mine.name || profileName || undefined,
                          team: myLabel || undefined,
                        });
                        setQrOpen(true);
                      } else {
                        openReserveModal(ev);
                      }
                    }}
                    disabled={isFull && !going}
                    className="btn-primary-cronos"
                    style={{ flex: 1, opacity: (isFull && !going) ? 0.5 : 1, cursor: (isFull && !going) ? "not-allowed" : "pointer" }}
                  >
                    {isFull && !going ? "Evento lleno" : going && mine?.reserveCode ? "Ver mi QR" : "Reservar lugar"}
                  </button>
                  <Link
                    href={"/events/" + ev.id}
                    className="btn-ghost-cronos"
                    style={{ textAlign: "center", textDecoration: "none" }}
                  >
                    Detalles
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ height: "80px" }} />
      </div>

      {/* Modal reserva */}
      <Modal open={open} onClose={() => setOpen(false)} title={selected ? "Confirmar reserva" : "Confirmar reserva"}>
        {selected && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs tracking-widest text-white/70">NOMBRE</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre"
                     className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 text-white outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs tracking-widest text-white/70">TELEFONO</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 415 555 1234"
                     className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 text-white outline-none focus:border-emerald-500" />
            </div>

            <div>
              <span className="block text-xs tracking-widest text-white/70">BANDO</span>
              {(() => {
                const aLabel = selected.split?.aLabel || selected.homeTeam || "Local";
                const bLabel = selected.split?.bLabel || selected.awayTeam || "Visitante";
                return (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800/60 p-3">
                      <input type="radio" name="teamHome" checked={teamChoice === "A"} onChange={() => setTeamChoice("A")} />
                      <span>{aLabel}</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800/60 p-3">
                      <input type="radio" name="teamHome" checked={teamChoice === "B"} onChange={() => setTeamChoice("B")} />
                      <span>{bLabel}</span>
                    </label>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-white/15 bg-zinc-800 px-4 py-3 text-white hover:bg-zinc-700 transition" disabled={saving}>
                Cancelar
              </button>
              <button onClick={confirmReserve} className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white hover:bg-emerald-600 transition disabled:opacity-60" disabled={saving}>
                {saving ? "Guardando..." : "Confirmar reserva"}
              </button>
            </div>

            <p className="pt-1 text-center text-xs text-white/60">* Te enviaremos tu codigo de reserva por SMS.</p>
          </div>
        )}
      </Modal>

      {/* Modal equipo favorito */}
      <Modal open={favOpen} onClose={() => setFavOpen(false)} title="Tu equipo favorito">
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Para completar tu reserva, dinos cual es tu <strong>equipo favorito</strong>.
          </p>
          <TeamsAutocomplete value={favTeam} onChange={setFavTeam} />
          <div className="flex gap-3 pt-2">
            <button onClick={() => setFavOpen(false)} className="flex-1 rounded-xl border border-white/15 bg-zinc-800 px-4 py-3 text-white hover:bg-zinc-700 transition" disabled={saving}>
              Atras
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
