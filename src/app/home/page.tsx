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
      <div style={{ position: "relative", zIndex: 10, width: "92%", maxWidth: "448px", borderRadius: "20px", border: "1px solid #142035", background: "#0a1220", padding: "20px", boxShadow: "0 24px 48px rgba(0,0,0,0.6)" }}>
        <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#e8f0ff", margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "#0d1528", border: "1px solid #142035", color: "#8899bb", borderRadius: "8px", padding: "4px 8px", fontSize: "14px", cursor: "pointer" }}>&#x2715;</button>
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
        <p style={{ color: "#8899bb", marginTop: "4px", fontSize: "13px" }}>
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
              <div key={ev.id} className="card-chrome-wrap" style={{ marginBottom: "12px" }}>
              <div style={{ background: "#0a1220", borderRadius: "18px", overflow: "hidden" }}>
                {/* Top: liga + venue pill */}
                <div style={{ padding: "14px 14px 8px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#ff8c00", fontWeight: 700, textTransform: "uppercase" }}>
                    {ev.league}
                  </div>
                  <div style={{ background: "#0d1528", border: "1px solid #142035", borderRadius: "10px", padding: "4px 10px", textAlign: "right" }}>
                    <div style={{ color: "#ff6b00", fontSize: "12px", fontWeight: 600 }}>{ev.venueName}</div>
                    <div style={{ color: "#8899bb", fontSize: "10px" }}>{ev.city}</div>
                  </div>
                </div>

                {/* Titulo */}
                <div style={{ fontSize: "17px", fontWeight: 700, color: "#e8f0ff", padding: "0 14px 10px" }}>
                  {ev.title}
                </div>


                {/* Fecha */}
                <div style={{ fontSize: "11px", color: "#8899bb", padding: "0 14px 8px" }}>
                  {fmtDateShort(ev.dateISO)}
                </div>

                {/* Barra de capacidad */}
                <div style={{ margin: "0 14px 4px", background: "#0d1a2e", borderRadius: "3px", height: "3px" }}>
                  <div style={{
                    background: "linear-gradient(90deg, #ff6b00, #ff8c00)",
                    width: Math.min((c.total / ev.capacity) * 100, 100) + "%",
                    height: "100%",
                    borderRadius: "3px",
                  }} />
                </div>

                {/* Texto capacidad */}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 14px 10px" }}>
                  <span style={{ color: "#8899bb", fontSize: "11px" }}>{c.total} / {ev.capacity} lugares</span>
                  {isFull ? (
                    <span style={{ color: "#3a5070", fontSize: "11px" }}>Lleno</span>
                  ) : remaining <= 5 ? (
                    <span style={{ color: "#00ff9d", fontSize: "11px" }}>{remaining} restantes</span>
                  ) : (
                    <span style={{ color: "#8899bb", fontSize: "11px" }}>Disponible</span>
                  )}
                </div>

                {/* Divisor */}
                <div style={{height:'1px', background:'#142035', margin:'8px 14px'}} />

                {/* Contadores de equipos */}
                {(() => {
                  const aLabel = ev.split?.aLabel || ev.homeTeam || "Local";
                  const bLabel = ev.split?.bLabel || ev.awayTeam || "Visitante";
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 32px 1fr", alignItems: "center", padding: "10px 14px" }}>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ color: "#e8f0ff", fontSize: "12px" }}>{aLabel}</div>
                        <div style={{ color: "#ff8c00", fontSize: "22px", fontWeight: 700 }}>{c.a}</div>
                      </div>
                      <div style={{ textAlign: "center", color: "#8899bb", fontSize: "10px", fontWeight: 700 }}>VS</div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#e8f0ff", fontSize: "12px" }}>{bLabel}</div>
                        <div style={{ color: "#ff8c00", fontSize: "22px", fontWeight: 700 }}>{c.b}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Botones */}
                <div style={{ padding: "0 14px 14px" }}>
                  {!going ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px" }}>
                      <button
                        onClick={() => openReserveModal(ev)}
                        style={{ background: "linear-gradient(135deg, #ff6b00, #ff8c00)", border: "none", color: "#fff", fontSize: "17px", fontWeight: 800, padding: "12px", borderRadius: "24px", cursor: "pointer", width: "100%" }}
                      >
                        Reservar lugar
                      </button>
                      <Link href={`/events/${ev.id}`} style={{ position: "relative", background: "rgba(192,192,192,0.05)", border: "1px solid rgba(192,192,192,0.2)", color: "#c8d8f0", fontSize: "15px", fontWeight: 600, padding: "12px 16px", borderRadius: "24px", cursor: "pointer", overflow: "hidden", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 0.5s ease", textDecoration: "none" }} className="group">
                        <span style={{ position: "absolute", top: 0, left: "12.5%", width: "75%", height: "1px", background: "linear-gradient(90deg,transparent,rgba(220,220,220,0.9),transparent)", opacity: 0, transition: "opacity 0.5s ease" }} className="neon-top" />
                        Detalles
                        <span style={{ position: "absolute", bottom: 0, left: "12.5%", width: "75%", height: "1px", background: "linear-gradient(90deg,transparent,rgba(220,220,220,0.7),transparent)", opacity: 0.3, transition: "opacity 0.5s ease" }} className="neon-bottom" />
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px" }}>
                      <Link href={`/events/${ev.id}`} style={{ position: "relative", background: "rgba(192,192,192,0.05)", border: "1px solid rgba(192,192,192,0.2)", color: "#c8d8f0", fontSize: "19px", fontWeight: 800, letterSpacing: "2px", padding: "12px 16px", borderRadius: "24px", cursor: "pointer", overflow: "hidden", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 0.5s ease", textDecoration: "none", width: "100%" }} className="group">
                        <span style={{ position: "absolute", top: 0, left: "12.5%", width: "75%", height: "1px", background: "linear-gradient(90deg,transparent,rgba(220,220,220,0.9),transparent)", opacity: 0, transition: "opacity 0.5s ease" }} className="neon-top" />
                        Detalles
                        <span style={{ position: "absolute", bottom: 0, left: "12.5%", width: "75%", height: "1px", background: "linear-gradient(90deg,transparent,rgba(220,220,220,0.7),transparent)", opacity: 0.3, transition: "opacity 0.5s ease" }} className="neon-bottom" />
                      </Link>
                      <button
                        onClick={() => {
                          setQrData({
                            code: mine?.reserveCode!,
                            eventTitle: ev.title,
                            userName: mine?.name || profileName || undefined,
                            team: myLabel || undefined,
                          });
                          setQrOpen(true);
                        }}
                        style={{ background: "linear-gradient(135deg, #ff6b00, #ff8c00)", border: "none", color: "#fff", fontSize: "15px", fontWeight: 800, padding: "12px 24px", borderRadius: "24px", cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        Ver QR
                      </button>
                    </div>
                  )}
                </div>
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
          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "10px", letterSpacing: "2px", color: "#8899bb", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>NOMBRE</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre"
                     style={{ width: "100%", background: "#0d1528", border: "1px solid #142035", color: "#e8f0ff", borderRadius: "11px", padding: "12px 14px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "10px", letterSpacing: "2px", color: "#8899bb", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>TELÉFONO</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 415 555 1234"
                     style={{ width: "100%", background: "#0d1528", border: "1px solid #142035", color: "#e8f0ff", borderRadius: "11px", padding: "12px 14px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div>
              <span style={{ display: "block", fontSize: "10px", letterSpacing: "2px", color: "#8899bb", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>BANDO</span>
              {(() => {
                const aLabel = selected.split?.aLabel || selected.homeTeam || "Local";
                const bLabel = selected.split?.bLabel || selected.awayTeam || "Visitante";
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", background: "#0d1528", border: "1px solid #142035", color: "#e8f0ff", borderRadius: "11px", padding: "12px", cursor: "pointer" }}>
                      <input type="radio" name="teamHome" checked={teamChoice === "A"} onChange={() => setTeamChoice("A")} />
                      <span>{aLabel}</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", background: "#0d1528", border: "1px solid #142035", color: "#e8f0ff", borderRadius: "11px", padding: "12px", cursor: "pointer" }}>
                      <input type="radio" name="teamHome" checked={teamChoice === "B"} onChange={() => setTeamChoice("B")} />
                      <span>{bLabel}</span>
                    </label>
                  </div>
                );
              })()}
            </div>

            <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
              <button onClick={() => setOpen(false)} disabled={saving} style={{ flex: 1, position: "relative", background: "rgba(192,192,192,0.05)", border: "1px solid rgba(192,192,192,0.2)", color: "#e8f0ff", fontSize: "14px", fontWeight: 600, padding: "12px", borderRadius: "24px", cursor: "pointer", overflow: "hidden", whiteSpace: "nowrap" }}>
                Cancelar
              </button>
              <button onClick={confirmReserve} disabled={saving} style={{ flex: 1, background: "linear-gradient(135deg, #ff6b00, #ff8c00)", color: "#fff", fontSize: "14px", fontWeight: 800, padding: "12px", borderRadius: "24px", border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Guardando..." : "Confirmar reserva"}
              </button>
            </div>

            <p style={{ textAlign: "center", fontSize: "12px", color: "#8899bb" }}>* Te enviaremos tu codigo de reserva por SMS.</p>
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
