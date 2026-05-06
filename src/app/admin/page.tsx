"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

import {
  getAllFanZones,
  createFanZone,
  updateFanZone,
  type FanZone,
  type FanZoneType,
  type FanZoneCountry,
} from "@/lib/firestore/fanzones";
import { seedWorldTeams } from "@/lib/firestore/seedTeams";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

// ─── Types ───────────────────────────────────────────────────────────────────

type EventStatus = "draft" | "published" | "live" | "closed";

type AdminEvent = {
  id: string;
  title: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  dateISO: string;
  venueName: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  capacity: number;
  status: EventStatus;
  attendeeCount: number;
};

type Attendee = {
  uid: string;
  name?: string;
  phone?: string;
  team?: string;
  reserveCode?: string;
  paidQuiniela?: boolean;
};

type AppUser = {
  uid: string;
  name?: string;
  email?: string;
  phone?: string;
  team?: string;
  createdAt?: string; // ISO string
};

type EventForm = {
  title: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  dateLocal: string; // datetime-local value (YYYY-MM-DDTHH:MM)
  venueName: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  capacity: number;
  status: EventStatus;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<EventStatus, string> = {
  draft:     "bg-zinc-700/80 text-zinc-300",
  published: "bg-emerald-500/25 text-emerald-300",
  live:      "bg-blue-500/25 text-blue-300",
  closed:    "bg-red-500/25 text-red-300",
};

function isoToLocal(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ""; }
}

function localToISO(local: string): string {
  if (!local) return "";
  return new Date(local).toISOString();
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-MX", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  } catch { return iso; }
}

const EMPTY_FORM: EventForm = {
  title: "", league: "", homeTeam: "", awayTeam: "",
  dateLocal: "", venueName: "", address: "", city: "",
  lat: 0, lng: 0, capacity: 20, status: "draft",
};

// ─── Fan Zone Form ────────────────────────────────────────────────────────────

type FanZoneForm = {
  type: FanZoneType;
  name: string;
  city: string;
  country: FanZoneCountry;
  venue: string;
  address: string;
  lat: number;
  lng: number;
  entry: string;
  datesOpen: string;
  officialUrl: string;
  registrationUrl: string;
  notes: string;
  active: boolean;
};

const EMPTY_FZ_FORM: FanZoneForm = {
  type: "fan_zone",
  name: "",
  city: "",
  country: "usa",
  venue: "",
  address: "",
  lat: 0,
  lng: 0,
  entry: "Gratuita",
  datesOpen: "",
  officialUrl: "",
  registrationUrl: "",
  notes: "",
  active: true,
};

// ─── Event Modal ─────────────────────────────────────────────────────────────

function EventModal({
  open, onClose, initial, editId, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: EventForm;
  editId: string | null; // null = new
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EventForm>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(initial); }, [initial]);

  if (!open) return null;

  function set<K extends keyof EventForm>(k: K, v: EventForm[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { alert("El título es obligatorio."); return; }
    setSaving(true);
    try {
      const ref = editId
        ? doc(db, "events", editId)
        : doc(collection(db, "events"));

      await setDoc(ref, {
        title:     form.title.trim(),
        league:    form.league.trim(),
        homeTeam:  form.homeTeam.trim(),
        awayTeam:  form.awayTeam.trim(),
        dateISO:   localToISO(form.dateLocal),
        venueName: form.venueName.trim(),
        address:   form.address.trim(),
        city:      form.city.trim(),
        lat:       Number(form.lat) || 0,
        lng:       Number(form.lng) || 0,
        capacity:  Number(form.capacity) || 20,
        status:    form.status,
        updatedAt: serverTimestamp(),
        ...(editId ? {} : { createdAt: serverTimestamp() }),
      }, { merge: true });

      onSaved();
      onClose();
    } catch (e: any) {
      alert(`Error al guardar: ${e?.message ?? "desconocido"}`);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-white/10 bg-zinc-800/70 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500";
  const labelCls = "block text-xs tracking-widest text-white/60 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900 p-6 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{editId ? "Editar evento" : "Nuevo evento"}</h3>
          <button onClick={onClose} className="rounded-lg bg-zinc-800 px-2 py-1 text-sm hover:bg-zinc-700">✕</button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>TÍTULO</label>
              <input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="México vs Japón" />
            </div>
            <div>
              <label className={labelCls}>LIGA</label>
              <input className={inputCls} value={form.league} onChange={(e) => set("league", e.target.value)} placeholder="Amistoso" />
            </div>
            <div>
              <label className={labelCls}>STATUS</label>
              <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value as EventStatus)}>
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="live">live</option>
                <option value="closed">closed</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>EQUIPO LOCAL</label>
              <input className={inputCls} value={form.homeTeam} onChange={(e) => set("homeTeam", e.target.value)} placeholder="México" />
            </div>
            <div>
              <label className={labelCls}>EQUIPO VISITANTE</label>
              <input className={inputCls} value={form.awayTeam} onChange={(e) => set("awayTeam", e.target.value)} placeholder="Japón" />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>FECHA Y HORA</label>
              <input type="datetime-local" className={inputCls} value={form.dateLocal} onChange={(e) => set("dateLocal", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>VENUE</label>
              <input className={inputCls} value={form.venueName} onChange={(e) => set("venueName", e.target.value)} placeholder="Bar Futbolero" />
            </div>
            <div>
              <label className={labelCls}>DIRECCIÓN</label>
              <input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Av. Centro 123" />
            </div>
            <div>
              <label className={labelCls}>CIUDAD</label>
              <input className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Oakland, CA" />
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}} className="col-span-2">
              <div>
                <label className={labelCls}>LATITUD</label>
                <input type="number" step="any" className={inputCls} value={form.lat} onChange={e => set("lat", parseFloat(e.target.value))} placeholder="37.8044" />
              </div>
              <div>
                <label className={labelCls}>LONGITUD</label>
                <input type="number" step="any" className={inputCls} value={form.lng} onChange={e => set("lng", parseFloat(e.target.value))} placeholder="-122.2712" />
              </div>
            </div>
            <div>
              <label className={labelCls}>CAPACIDAD</label>
              <input type="number" min={1} className={inputCls} value={form.capacity} onChange={(e) => set("capacity", Number(e.target.value))} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 rounded-xl border border-white/15 bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 transition disabled:opacity-60">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition disabled:opacity-60">
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Fan Zone Modal ───────────────────────────────────────────────────────────

function FanZoneModal({
  open, onClose, initial, editId, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: FanZoneForm;
  editId: string | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FanZoneForm>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(initial); }, [initial]);

  if (!open) return null;

  function setF<K extends keyof FanZoneForm>(k: K, v: FanZoneForm[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { alert("El nombre es obligatorio."); return; }
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        name: form.name.trim(),
        city: form.city.trim(),
        country: form.country,
        venue: form.venue.trim(),
        address: form.address.trim(),
        lat: Number(form.lat) || 0,
        lng: Number(form.lng) || 0,
        entry: form.entry.trim(),
        datesOpen: form.datesOpen.trim(),
        officialUrl: form.officialUrl.trim() || null,
        registrationUrl: form.registrationUrl.trim() || null,
        notes: form.notes.trim() || null,
        active: form.active,
      };
      if (editId) {
        await updateFanZone(editId, payload);
      } else {
        await createFanZone(payload);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      alert(`Error al guardar: ${e?.message ?? "desconocido"}`);
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full rounded-lg border border-white/10 bg-zinc-800/70 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500";
  const lbl = "block text-xs tracking-widest text-white/60 mb-1";
  const inpHighlight = "w-full rounded-lg border-2 border-yellow-400/60 bg-zinc-800/70 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900 p-6 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{editId ? "Editar Fan Zone" : "Nuevo Fan Zone"}</h3>
          <button onClick={onClose} className="rounded-lg bg-zinc-800 px-2 py-1 text-sm hover:bg-zinc-700">✕</button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">

            {/* Tipo */}
            <div>
              <label className={lbl}>TIPO</label>
              <select className={inp} value={form.type} onChange={(e) => setF("type", e.target.value as FanZoneType)}>
                <option value="fan_festival">FIFA Fan Festival oficial</option>
                <option value="fan_zone">Fan Zone</option>
              </select>
            </div>

            {/* País */}
            <div>
              <label className={lbl}>PAÍS</label>
              <select className={inp} value={form.country} onChange={(e) => setF("country", e.target.value as FanZoneCountry)}>
                <option value="usa">🇺🇸 EE.UU.</option>
                <option value="canada">🇨🇦 Canadá</option>
                <option value="mexico">🇲🇽 México</option>
              </select>
            </div>

            {/* Nombre */}
            <div className="col-span-2">
              <label className={lbl}>NOMBRE</label>
              <input className={inp} value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="FIFA Fan Festival Dallas" />
            </div>

            {/* Ciudad */}
            <div>
              <label className={lbl}>CIUDAD</label>
              <input className={inp} value={form.city} onChange={(e) => setF("city", e.target.value)} placeholder="Dallas" />
            </div>

            {/* Venue */}
            <div>
              <label className={lbl}>VENUE</label>
              <input className={inp} value={form.venue} onChange={(e) => setF("venue", e.target.value)} placeholder="Fair Park" />
            </div>

            {/* Dirección */}
            <div className="col-span-2">
              <label className={lbl}>DIRECCIÓN</label>
              <input className={inp} value={form.address} onChange={(e) => setF("address", e.target.value)} placeholder="3809 Grand Ave, Dallas, TX 75210" />
            </div>

            {/* Lat / Lng */}
            <div>
              <label className={lbl}>LATITUD</label>
              <input type="number" step="any" className={inp} value={form.lat} onChange={(e) => setF("lat", parseFloat(e.target.value))} />
            </div>
            <div>
              <label className={lbl}>LONGITUD</label>
              <input type="number" step="any" className={inp} value={form.lng} onChange={(e) => setF("lng", parseFloat(e.target.value))} />
            </div>

            {/* Fechas */}
            <div className="col-span-2">
              <label className={lbl}>FECHAS DE OPERACIÓN</label>
              <input className={inp} value={form.datesOpen} onChange={(e) => setF("datesOpen", e.target.value)} placeholder="11 jun – 19 jul 2026 (39 días)" />
            </div>

            {/* Entrada */}
            <div className="col-span-2">
              <label className={lbl}>ENTRADA</label>
              <input className={inp} value={form.entry} onChange={(e) => setF("entry", e.target.value)} placeholder="Gratuita / Requiere registro / Ticketed" />
            </div>

            {/* Registration URL — destacado */}
            <div className="col-span-2">
              <label className="block text-xs tracking-widest text-yellow-400 mb-1 font-semibold">
                URL DE REGISTRO ★
              </label>
              <input
                className={inpHighlight}
                value={form.registrationUrl}
                onChange={(e) => setF("registrationUrl", e.target.value)}
                placeholder="https://… (deja vacío si no aplica)"
              />
              <p className="mt-1 text-xs text-yellow-400/70">Activa el botón "Registrarse" en las cards públicas.</p>
            </div>

            {/* Official URL */}
            <div className="col-span-2">
              <label className={lbl}>SITIO OFICIAL (opcional)</label>
              <input className={inp} value={form.officialUrl} onChange={(e) => setF("officialUrl", e.target.value)} placeholder="https://…" />
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className={lbl}>NOTAS (opcional)</label>
              <textarea
                className={inp}
                rows={2}
                value={form.notes}
                onChange={(e) => setF("notes", e.target.value)}
                placeholder="Info adicional visible en la card…"
              />
            </div>

            {/* Active toggle */}
            <div className="col-span-2 flex items-center gap-3">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form.active}
                  onChange={(e) => setF("active", e.target.checked)}
                />
                <div className="h-6 w-11 rounded-full bg-zinc-600 peer-checked:bg-emerald-500 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
              </label>
              <span className="text-sm text-white/80">
                {form.active ? "Activo — visible en la página pública" : "Inactivo — oculto del público"}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 rounded-xl border border-white/15 bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 transition disabled:opacity-60">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition disabled:opacity-60">
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Attendees Section ────────────────────────────────────────────────────────

function AttendeesSection({ events }: { events: AdminEvent[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loadingA, setLoadingA] = useState(false);
  const [togglingUid, setTogglingUid] = useState<string | null>(null);

  async function loadAttendees(eventId: string) {
    setLoadingA(true);
    try {
      const snap = await getDocs(collection(db, "events", eventId, "attendees"));
      setAttendees(
        snap.docs.map((d) => ({
          uid: d.id,
          name: d.data().name,
          phone: d.data().phone,
          team: d.data().team,
          reserveCode: d.data().reserveCode,
          paidQuiniela: d.data().paidQuiniela ?? false,
        }))
      );
    } catch (e: any) {
      alert(`Error cargando asistentes: ${e?.message}`);
    } finally {
      setLoadingA(false);
    }
  }

  function handleSelectEvent(id: string) {
    setSelectedId(id);
    setAttendees([]);
    if (id) loadAttendees(id);
  }

  async function togglePaid(a: Attendee) {
    if (!selectedId) return;
    setTogglingUid(a.uid);
    try {
      await updateDoc(doc(db, "events", selectedId, "attendees", a.uid), {
        paidQuiniela: !a.paidQuiniela,
      });
      setAttendees((prev) =>
        prev.map((x) => x.uid === a.uid ? { ...x, paidQuiniela: !x.paidQuiniela } : x)
      );
    } catch (e: any) {
      alert(`Error: ${e?.message}`);
    } finally {
      setTogglingUid(null);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/50 p-4">
      <div className="mb-3 font-semibold text-white/90">Asistentes</div>

      <select
        value={selectedId}
        onChange={(e) => handleSelectEvent(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-zinc-800/70 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
      >
        <option value="">— Selecciona un evento —</option>
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>{ev.title} ({ev.status})</option>
        ))}
      </select>

      {loadingA && (
        <div className="mt-4 text-sm text-zinc-400">Cargando asistentes…</div>
      )}

      {!loadingA && selectedId && attendees.length === 0 && (
        <div className="mt-4 text-sm text-zinc-400">Sin asistentes registrados.</div>
      )}

      {attendees.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-zinc-400">
                <th className="pb-2 pr-3">Nombre</th>
                <th className="pb-2 pr-3">Teléfono</th>
                <th className="pb-2 pr-3">Equipo</th>
                <th className="pb-2 pr-3">Código</th>
                <th className="pb-2">Quiniela</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {attendees.map((a) => (
                <tr key={a.uid}>
                  <td className="py-2 pr-3 text-white">{a.name || <span className="text-zinc-500">—</span>}</td>
                  <td className="py-2 pr-3 text-zinc-300">{a.phone || "—"}</td>
                  <td className="py-2 pr-3 text-zinc-300">{a.team || "—"}</td>
                  <td className="py-2 pr-3 font-mono text-zinc-300">{a.reserveCode || "—"}</td>
                  <td className="py-2">
                    <button
                      onClick={() => togglePaid(a)}
                      disabled={togglingUid === a.uid}
                      className={`rounded-lg px-2 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                        a.paidQuiniela
                          ? "bg-emerald-500/30 text-emerald-300 hover:bg-emerald-500/50"
                          : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
                      }`}
                    >
                      {a.paidQuiniela ? "Pagó ✓" : "Pendiente"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Events list
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Event modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [modalInitial, setModalInitial] = useState<EventForm>(EMPTY_FORM);

  // Fan Zones list
  const [fanZones, setFanZones] = useState<FanZone[]>([]);
  const [loadingFZ, setLoadingFZ] = useState(false);

  // Fan Zone modal
  const [fzModalOpen, setFzModalOpen] = useState(false);
  const [fzEditId, setFzEditId] = useState<string | null>(null);
  const [fzModalInitial, setFzModalInitial] = useState<FanZoneForm>(EMPTY_FZ_FORM);

  // Seed teams
  const [seedingTeams, setSeedingTeams] = useState(false);
  const [teamSeedMsg, setTeamSeedMsg] = useState("");

  // Users list
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const admins = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_ADMIN_UIDS || "";
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }, []);

  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
      setLoading(false);
    });
    return () => off();
  }, []);

  async function fetchEvents() {
    setLoadingEvents(true);
    try {
      const snap = await getDocs(collection(db, "events"));
      const list: AdminEvent[] = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data() as any;
          const attSnap = await getDocs(collection(db, "events", d.id, "attendees"));
          return {
            id: d.id,
            title:     data.title || "Sin título",
            league:    data.league || "",
            homeTeam:  data.homeTeam || "",
            awayTeam:  data.awayTeam || "",
            dateISO:   data.dateISO || "",
            venueName: data.venueName || "",
            address:   data.address || "",
            city:      data.city || "",
            lat:       data.lat ?? 0,
            lng:       data.lng ?? 0,
            capacity:  data.capacity ?? 20,
            status:    (data.status as EventStatus) || "draft",
            attendeeCount: attSnap.size,
          };
        })
      );
      list.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
      setEvents(list);
    } catch (e: any) {
      alert(`Error cargando eventos: ${e?.message}`);
    } finally {
      setLoadingEvents(false);
    }
  }

  // Load events once admin access is confirmed
  const [eventsLoaded, setEventsLoaded] = useState(false);
  useEffect(() => {
    if (uid && admins.includes(uid) && !eventsLoaded) {
      setEventsLoaded(true);
      fetchEvents();
      fetchFanZones();
    }
  }, [uid, admins, eventsLoaded]);

  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const list: AppUser[] = snap.docs.map((d) => {
        const data = d.data() as any;
        const raw = data.createdAt;
        let createdAt: string | undefined;
        if (raw?.toDate) {
          createdAt = raw.toDate().toISOString();
        } else if (typeof raw === "string") {
          createdAt = raw;
        }
        return {
          uid: d.id,
          name: data.name || data.displayName,
          email: data.email,
          phone: data.phone,
          team: data.team,
          createdAt,
        };
      });
      list.sort((a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.localeCompare(a.createdAt);
      });
      setUsers(list);
    } catch (e: any) {
      alert(`Error cargando usuarios: ${e?.message}`);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function fetchFanZones() {
    setLoadingFZ(true);
    try {
      const list = await getAllFanZones();
      setFanZones(list);
    } catch (e: any) {
      alert(`Error cargando Fan Zones: ${e?.message}`);
    } finally {
      setLoadingFZ(false);
    }
  }

  function openNew() {
    setEditId(null);
    setModalInitial(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(ev: AdminEvent) {
    setEditId(ev.id);
    setModalInitial({
      title:     ev.title,
      league:    ev.league,
      homeTeam:  ev.homeTeam,
      awayTeam:  ev.awayTeam,
      dateLocal: isoToLocal(ev.dateISO),
      venueName: ev.venueName,
      address:   ev.address,
      city:      ev.city,
      lat:       ev.lat,
      lng:       ev.lng,
      capacity:  ev.capacity,
      status:    ev.status,
    });
    setModalOpen(true);
  }

  function openFZNew() {
    setFzEditId(null);
    setFzModalInitial(EMPTY_FZ_FORM);
    setFzModalOpen(true);
  }

  function openFZEdit(fz: FanZone) {
    setFzEditId(fz.id);
    setFzModalInitial({
      type:            fz.type,
      name:            fz.name,
      city:            fz.city,
      country:         fz.country,
      venue:           fz.venue,
      address:         fz.address,
      lat:             fz.lat,
      lng:             fz.lng,
      entry:           fz.entry,
      datesOpen:       fz.datesOpen,
      officialUrl:     fz.officialUrl ?? "",
      registrationUrl: fz.registrationUrl ?? "",
      notes:           fz.notes ?? "",
      active:          fz.active,
    });
    setFzModalOpen(true);
  }

  if (loading) {
    return <main className="grid min-h-dvh place-items-center text-white">Cargando…</main>;
  }

  if (!uid) {
    return (
      <main className="grid min-h-dvh place-items-center text-white">
        <div className="rounded-xl border border-white/10 bg-black/60 px-6 py-4 text-center">
          Debes iniciar sesión para entrar a Admin.{" "}
          <Link className="underline" href="/auth/login">Ir a iniciar sesión</Link>
        </div>
      </main>
    );
  }

  const hasAccess = admins.includes(uid);

  if (!hasAccess) {
    return (
      <main className="grid min-h-dvh place-items-center text-white">
        <div className="rounded-xl border border-white/10 bg-black/60 px-6 py-4 text-center">
          No tienes acceso a esta página. UID actual: <code>{uid}</code>
          <div className="mt-2 text-sm text-white/70">
            (Si eres admin, agrega tu UID a NEXT_PUBLIC_ADMIN_UIDS y reinicia el servidor)
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh w-full">
      <img src="/images/stadium.jpg" alt="" className="absolute inset-0 h-full w-full object-cover blur-sm" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-8 text-white">
        <h1 className="text-3xl font-bold">Panel Admin</h1>
        <p className="mt-1 text-white/80">UID: <code>{uid}</code></p>

        <div className="mt-6 grid gap-4">
          <Link href="/home" className="underline text-emerald-300">Volver al Home</Link>

          {/* ── Eventos ── */}
          <div className="rounded-xl border border-white/10 bg-black/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-white/90">Eventos</span>
              <div className="flex gap-2">
                <button
                  onClick={fetchEvents}
                  disabled={loadingEvents}
                  className="rounded-lg border border-white/15 bg-zinc-800 px-3 py-1 text-xs text-white hover:bg-zinc-700 transition disabled:opacity-50"
                >
                  {loadingEvents ? "Cargando…" : "↺ Refrescar"}
                </button>
                <button
                  onClick={openNew}
                  className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600 transition"
                >
                  + Nuevo evento
                </button>
              </div>
            </div>

            {loadingEvents ? (
              <div className="text-sm text-zinc-400">Cargando eventos…</div>
            ) : events.length === 0 ? (
              <div className="text-sm text-zinc-400">No hay eventos. Usa "Inicializar" o crea uno nuevo.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs text-zinc-400">
                      <th className="pb-2 pr-3">Título / Liga</th>
                      <th className="pb-2 pr-3">Fecha</th>
                      <th className="pb-2 pr-3">Venue</th>
                      <th className="pb-2 pr-3 text-center">Status</th>
                      <th className="pb-2 pr-3 text-center">Cap.</th>
                      <th className="pb-2 text-center">Asist.</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {events.map((ev) => (
                      <tr key={ev.id}>
                        <td className="py-2 pr-3">
                          <div className="font-medium text-white">{ev.title}</div>
                          <div className="text-xs text-zinc-400">{ev.league}</div>
                        </td>
                        <td className="py-2 pr-3 text-zinc-300 text-xs whitespace-nowrap">
                          {fmtDate(ev.dateISO)}
                        </td>
                        <td className="py-2 pr-3">
                          <div className="text-zinc-300 text-xs">{ev.venueName}</div>
                          <div className="text-zinc-500 text-xs">{ev.city}</div>
                        </td>
                        <td className="py-2 pr-3 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[ev.status] ?? STATUS_BADGE.draft}`}>
                            {ev.status}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-center text-zinc-300">{ev.capacity}</td>
                        <td className="py-2 text-center text-zinc-300">{ev.attendeeCount}</td>
                        <td className="py-2 pl-3">
                          <button
                            onClick={() => openEdit(ev)}
                            className="rounded-lg border border-white/15 bg-zinc-800 px-2 py-1 text-xs text-white hover:bg-zinc-700 transition"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Asistentes ── */}
          <AttendeesSection events={events} />

          {/* ── Fan Zones & Festivales ── */}
          <div className="rounded-xl border border-yellow-500/20 bg-black/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-white/90">
                Fan Zones &amp; Festivales — Mundial 2026
              </span>
              <div className="flex gap-2">
                <button
                  onClick={fetchFanZones}
                  disabled={loadingFZ}
                  className="rounded-lg border border-white/15 bg-zinc-800 px-3 py-1 text-xs text-white hover:bg-zinc-700 transition disabled:opacity-50"
                >
                  {loadingFZ ? "Cargando…" : "↺ Refrescar"}
                </button>
                <button
                  onClick={openFZNew}
                  className="rounded-lg bg-yellow-500 px-3 py-1 text-xs font-semibold text-black hover:bg-yellow-400 transition"
                >
                  + Nuevo
                </button>
              </div>
            </div>

            {loadingFZ ? (
              <div className="text-sm text-zinc-400">Cargando…</div>
            ) : fanZones.length === 0 ? (
              <div className="text-sm text-zinc-400">
                Sin Fan Zones. Usa "Inicializar Fan Zones" o crea uno nuevo.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs text-zinc-400">
                      <th className="pb-2 pr-3">Tipo</th>
                      <th className="pb-2 pr-3">Nombre / Ciudad</th>
                      <th className="pb-2 pr-3">Venue</th>
                      <th className="pb-2 pr-3">Registro</th>
                      <th className="pb-2 pr-3 text-center">Activo</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {fanZones.map((fz) => (
                      <tr key={fz.id}>
                        <td className="py-2 pr-3">
                          {fz.type === "fan_festival" ? (
                            <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-semibold text-yellow-300 whitespace-nowrap">
                              Fan Festival
                            </span>
                          ) : (
                            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-300 whitespace-nowrap">
                              Fan Zone
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          <div className="font-medium text-white">{fz.name}</div>
                          <div className="text-xs text-zinc-400">
                            {fz.city},{" "}
                            {fz.country === "usa" ? "🇺🇸" : fz.country === "canada" ? "🇨🇦" : "🇲🇽"}
                          </div>
                        </td>
                        <td className="py-2 pr-3 text-xs text-zinc-300 max-w-[140px] truncate">
                          {fz.venue}
                        </td>
                        <td className="py-2 pr-3 text-xs">
                          {fz.registrationUrl ? (
                            <span className="text-yellow-300">✓ Sí</span>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-center text-xs">
                          {fz.active ? (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-300">Sí</span>
                          ) : (
                            <span className="rounded-full bg-zinc-700/80 px-2 py-0.5 text-zinc-400">No</span>
                          )}
                        </td>
                        <td className="py-2 pl-3">
                          <button
                            onClick={() => openFZEdit(fz)}
                            className="rounded-lg border border-white/15 bg-zinc-800 px-2 py-1 text-xs text-white hover:bg-zinc-700 transition"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Usuarios registrados ── */}
          <div className="rounded-xl border border-white/10 bg-black/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-white/90">
                Usuarios registrados
                {users.length > 0 && (
                  <span className="ml-2 rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                    {users.length}
                  </span>
                )}
              </span>
              <button
                onClick={fetchUsers}
                disabled={loadingUsers}
                className="rounded-lg border border-white/15 bg-zinc-800 px-3 py-1 text-xs text-white hover:bg-zinc-700 transition disabled:opacity-50"
              >
                {loadingUsers ? "Cargando…" : "↺ Refrescar"}
              </button>
            </div>

            {loadingUsers ? (
              <div className="text-sm text-zinc-400">Cargando usuarios…</div>
            ) : users.length === 0 ? (
              <div className="text-sm text-zinc-400">
                No hay usuarios registrados aún.{" "}
                <button onClick={fetchUsers} className="underline">Cargar</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs text-zinc-400">
                      <th className="pb-2 pr-3">Nombre</th>
                      <th className="pb-2 pr-3">Email / Teléfono</th>
                      <th className="pb-2 pr-3">Equipo</th>
                      <th className="pb-2">Registro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u) => (
                      <tr key={u.uid}>
                        <td className="py-2 pr-3 text-white">{u.name || <span className="text-zinc-500">—</span>}</td>
                        <td className="py-2 pr-3 text-zinc-300 text-xs">
                          {u.email || u.phone || <span className="text-zinc-500">—</span>}
                        </td>
                        <td className="py-2 pr-3 text-zinc-300 text-xs">{u.team || <span className="text-zinc-500">—</span>}</td>
                        <td className="py-2 text-zinc-400 text-xs whitespace-nowrap">
                          {u.createdAt ? fmtDate(u.createdAt) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Equipos — Seed ── */}
          <div className="rounded-xl border border-white/10 bg-black/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-white/90">Equipos</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={async () => {
                  setSeedingTeams(true);
                  setTeamSeedMsg("");
                  try {
                    const n = await seedWorldTeams();
                    setTeamSeedMsg(`✓ ${n} equipos cargados correctamente.`);
                  } catch (e: any) {
                    setTeamSeedMsg(`Error: ${e?.message ?? "desconocido"}`);
                  } finally {
                    setSeedingTeams(false);
                  }
                }}
                disabled={seedingTeams}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50"
              >
                {seedingTeams ? "Cargando…" : "Cargar equipos mundiales (~500)"}
              </button>
              {teamSeedMsg && (
                <span className="text-sm text-emerald-300">{teamSeedMsg}</span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modal crear/editar evento */}
      <EventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={modalInitial}
        editId={editId}
        onSaved={fetchEvents}
      />

      {/* Modal crear/editar Fan Zone */}
      <FanZoneModal
        open={fzModalOpen}
        onClose={() => setFzModalOpen(false)}
        initial={fzModalInitial}
        editId={fzEditId}
        onSaved={fetchFanZones}
      />
    </main>
  );
}
