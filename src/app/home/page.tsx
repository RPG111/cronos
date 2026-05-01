// src/app/home/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app as firebaseApp } from "../../lib/firebase";
import {
  getActiveFanZones,
  saveFanZoneForUser,
  removeFanZoneForUser,
  getSavedFanZoneIds,
  distanceKm,
  type FanZone,
} from "../../lib/firestore/fanzones";
import { useGeoStore } from "../../lib/store";
import BottomNav from "../../components/BottomNav";
import Header from "@/components/Header";
import RestaurantLead from "@/components/RestaurantLead";
import { Star } from "lucide-react";

// ── Country helpers ──────────────────────────────────────────────────────────

const COUNTRY_FLAG: Record<string, string> = {
  usa: "🇺🇸",
  canada: "🇨🇦",
  mexico: "🇲🇽",
};

const COUNTRY_NAME: Record<string, string> = {
  usa: "EE.UU.",
  canada: "Canadá",
  mexico: "México",
};

const COUNTRY_ORDER = ["usa", "canada", "mexico"];

// ── Countdown ────────────────────────────────────────────────────────────────

const WC_START = new Date("2026-06-11T00:00:00Z").getTime();

function useCountdown() {
  const [diff, setDiff] = useState(WC_START - Date.now());

  useEffect(() => {
    const id = setInterval(() => setDiff(WC_START - Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
    secs: Math.floor((diff % 60000) / 1000),
  };
}

// ── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: FanZone["type"] }) {
  if (type === "fan_festival") {
    return (
      <span style={{
        display: "inline-block",
        background: "rgba(245,158,11,0.15)",
        border: "1px solid rgba(245,158,11,0.4)",
        color: "#f59e0b",
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.5px",
        padding: "3px 9px",
        borderRadius: "20px",
        whiteSpace: "nowrap",
      }}>
        FIFA Fan Festival oficial
      </span>
    );
  }
  return (
    <span style={{
      display: "inline-block",
      background: "rgba(59,130,246,0.15)",
      border: "1px solid rgba(59,130,246,0.4)",
      color: "#60a5fa",
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "0.5px",
      padding: "3px 9px",
      borderRadius: "20px",
      whiteSpace: "nowrap",
    }}>
      Fan Zone
    </span>
  );
}

// ── Fan Zone Card ────────────────────────────────────────────────────────────

function FanZoneCard({
  zone,
  isSaved,
  onToggleSave,
  userLat,
  userLng,
}: {
  zone: FanZone;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  userLat: number | null;
  userLng: number | null;
}) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(zone.address)}`;
  const dist =
    userLat != null && userLng != null
      ? distanceKm(userLat, userLng, zone.lat, zone.lng)
      : null;

  const entryColor = zone.entry.toLowerCase().startsWith("gratuita")
    ? "#00c97a"
    : "#f59e0b";

  const registrationLabel =
    zone.entry.toLowerCase().includes("registro") ? "Registrarse" : "Más info";

  return (
    <div className="card-chrome-wrap" style={{ marginBottom: "12px" }}>
      <div style={{ background: "#0a1220", borderRadius: "18px", padding: "14px" }}>
        {/* Top: badge + estrella */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
          <TypeBadge type={zone.type} />
          <button
            onClick={() => onToggleSave(zone.id)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 0", flexShrink: 0, lineHeight: 1 }}
            aria-label={isSaved ? "Quitar de favoritos" : "Guardar en favoritos"}
          >
            <Star
              size={17}
              strokeWidth={1.5}
              fill={isSaved ? "#f59e0b" : "none"}
              stroke={isSaved ? "#f59e0b" : "#8899bb"}
            />
          </button>
        </div>

        {/* Nombre */}
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#e8f0ff", marginBottom: "4px", lineHeight: 1.3 }}>
          {zone.name}
        </div>

        {/* Ciudad + país + distancia */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
          <span style={{ fontSize: "13px", color: "#8899bb" }}>
            {COUNTRY_FLAG[zone.country]} {zone.city}, {COUNTRY_NAME[zone.country]}
          </span>
          {dist != null && (
            <span style={{
              fontSize: "11px",
              color: "#ff8c00",
              background: "rgba(255,140,0,0.1)",
              borderRadius: "10px",
              padding: "1px 7px",
            }}>
              {dist < 10 ? dist.toFixed(1) : Math.round(dist)} km
            </span>
          )}
        </div>

        {/* Venue + dirección */}
        <div style={{ fontSize: "12px", color: "#6677aa", marginBottom: "2px" }}>{zone.venue}</div>
        <div style={{ fontSize: "11px", color: "#4a5a7a", marginBottom: "10px" }}>{zone.address}</div>

        {/* Divisor */}
        <div style={{ height: "1px", background: "#142035", marginBottom: "10px" }} />

        {/* Fechas + entrada */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
          <span style={{ fontSize: "12px", color: "#8899bb" }}>
            📅 {zone.datesOpen}
          </span>
          <span style={{ fontSize: "12px", color: entryColor, fontWeight: 600 }}>
            🎟 {zone.entry}
          </span>
        </div>

        {/* Notas */}
        {zone.notes && (
          <div style={{ fontSize: "11px", color: "#6677aa", fontStyle: "italic", marginBottom: "10px" }}>
            {zone.notes}
          </div>
        )}

        {/* Botones */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {zone.registrationUrl && (
            <a
              href={zone.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "linear-gradient(135deg, #ff6b00, #ff8c00)",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 700,
                padding: "8px 14px",
                borderRadius: "20px",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {registrationLabel}
            </a>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "rgba(192,192,192,0.07)",
              border: "1px solid rgba(192,192,192,0.2)",
              color: "#c8d8f0",
              fontSize: "12px",
              fontWeight: 600,
              padding: "8px 14px",
              borderRadius: "20px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Cómo llegar
          </a>
          {zone.registrationUrl ? (
            <a
              href={zone.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#ffffff",
                fontSize: "11px",
                textDecoration: "underline",
                padding: "4px 0",
              }}
            >
              Regístrate aquí
            </a>
          ) : zone.officialUrl ? (
            <a
              href={zone.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#8899bb",
                fontSize: "11px",
                textDecoration: "underline",
                padding: "4px 0",
              }}
            >
              Sitio oficial
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [zones, setZones] = useState<FanZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState<"usa" | "canada" | "mexico">("mexico");
  const [typeFilter, setTypeFilter] = useState<"all" | "fan_festival" | "fan_zone">("all");
  const [tooltip, setTooltip] = useState<"fan_festival" | "fan_zone" | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [leadOpen, setLeadOpen] = useState(false);

  const { userLat, userLng } = useGeoStore();
  const countdown = useCountdown();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Auth — solo para favoritos
  useEffect(() => {
    const auth = getAuth(firebaseApp);
    return onAuthStateChanged(auth, async (u) => {
      setUid(u?.uid ?? null);
      if (u) {
        try {
          const ids = await getSavedFanZoneIds(u.uid);
          setSavedIds(new Set(ids));
        } catch {}
      } else {
        setSavedIds(new Set());
      }
    });
  }, []);

  // Cargar fan zones una vez
  useEffect(() => {
    getActiveFanZones()
      .then(setZones)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Ordenar client-side (reacciona a ubicación)
  const sorted = useMemo(() => {
    if (!zones.length) return [];
    if (userLat != null && userLng != null) {
      return [...zones].sort(
        (a, b) =>
          distanceKm(userLat, userLng, a.lat, a.lng) -
          distanceKm(userLat, userLng, b.lat, b.lng)
      );
    }
    return [...zones].sort((a, b) => {
      const ci =
        COUNTRY_ORDER.indexOf(a.country) - COUNTRY_ORDER.indexOf(b.country);
      if (ci !== 0) return ci;
      return a.city.localeCompare(b.city);
    });
  }, [zones, userLat, userLng]);

  // Filtro por país + tipo
  const filtered = useMemo(() => {
    return sorted.filter((z) => {
      if (z.country !== countryFilter) return false;
      if (typeFilter !== "all" && z.type !== typeFilter) return false;
      return true;
    });
  }, [sorted, countryFilter, typeFilter]);

  async function handleToggleSave(id: string) {
    if (!uid) return; // sin auth: no hacer nada
    const next = new Set(savedIds);
    const wasSaved = next.has(id);
    // Optimistic update
    if (wasSaved) next.delete(id);
    else next.add(id);
    setSavedIds(next);
    try {
      if (wasSaved) await removeFanZoneForUser(uid, id);
      else await saveFanZoneForUser(uid, id);
    } catch (e) {
      setSavedIds(savedIds); // revertir
      console.error(e);
    }
  }

  async function handleSignOut() {
    try {
      await signOut(getAuth(firebaseApp));
      window.location.href = "/auth/login";
    } catch (e) {
      console.error(e);
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

        {/* ── Sección 1: Banner ── */}
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#e8f0ff", margin: 0, lineHeight: 1.3 }}>
            Encuentra dónde ver el Mundial 2026 cerca de ti.
          </h2>
          <p style={{ color: "#8899bb", marginTop: "6px", fontSize: "13px" }}>
            Fan Zones y Fan Festivals oficiales en USA, Canadá y México.
          </p>

          {mounted && countdown && (
            <div style={{
              marginTop: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
              background: "rgba(255,140,0,0.08)",
              border: "1px solid rgba(255,140,0,0.2)",
              borderRadius: "12px",
              padding: "6px 12px",
            }}>
              <span style={{ fontSize: "11px", color: "#8899bb", marginRight: "6px" }}>⏱ Faltan</span>
              {[
                { v: countdown.days, l: "d" },
                { v: countdown.hours, l: "h" },
                { v: countdown.mins, l: "m" },
                { v: countdown.secs, l: "s" },
              ].map(({ v, l }) => (
                <span key={l} style={{ fontSize: "13px", color: "#ff8c00", fontWeight: 700, fontVariantNumeric: "tabular-nums", marginRight: "4px" }}>
                  {String(v).padStart(2, "0")}{l}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Sección 2: Filtros + Lista ── */}

        {/* Fila 1: filtro por tipo */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap", position: "relative" }}>

          {/* Overlay para cerrar tooltip al tocar fuera */}
          {tooltip && (
            <div
              onClick={() => setTooltip(null)}
              style={{ position: "fixed", inset: 0, zIndex: 90 }}
            />
          )}

          {/* Todos */}
          <button
            onClick={() => setTypeFilter("all")}
            style={{
              background: typeFilter === "all" ? "#ff8c00" : "#0a1220",
              border: `1px solid ${typeFilter === "all" ? "#ff8c00" : "#142035"}`,
              color: typeFilter === "all" ? "#fff" : "#8899bb",
              borderRadius: "20px",
              padding: "7px 16px",
              fontSize: "13px",
              fontWeight: typeFilter === "all" ? 700 : 400,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Todos
          </button>

          {/* Fan Festival */}
          <div style={{ position: "relative", zIndex: tooltip === "fan_festival" ? 100 : "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <button
                onClick={() => setTypeFilter("fan_festival")}
                style={{
                  background: typeFilter === "fan_festival" ? "#ff8c00" : "#0a1220",
                  border: `1px solid ${typeFilter === "fan_festival" ? "#ff8c00" : "#142035"}`,
                  color: typeFilter === "fan_festival" ? "#fff" : "#8899bb",
                  borderRadius: "20px",
                  padding: "7px 16px",
                  fontSize: "13px",
                  fontWeight: typeFilter === "fan_festival" ? 700 : 400,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Fan Festival
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setTooltip(tooltip === "fan_festival" ? null : "fan_festival"); }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6677aa",
                  fontSize: "14px",
                  cursor: "pointer",
                  padding: "2px",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
                aria-label="Información sobre Fan Festival"
              >
                ⓘ
              </button>
            </div>
            {tooltip === "fan_festival" && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                zIndex: 100,
                background: "#0e1a2e",
                border: "1px solid #1e3050",
                borderRadius: "12px",
                padding: "12px 14px",
                fontSize: "12px",
                color: "#c8d8f0",
                lineHeight: 1.5,
                width: "240px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}>
                Evento oficial organizado por FIFA. Pantallas gigantes, conciertos y activaciones. Algunos requieren registro anticipado.
              </div>
            )}
          </div>

          {/* Fan Zone */}
          <div style={{ position: "relative", zIndex: tooltip === "fan_zone" ? 100 : "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <button
                onClick={() => setTypeFilter("fan_zone")}
                style={{
                  background: typeFilter === "fan_zone" ? "#ff8c00" : "#0a1220",
                  border: `1px solid ${typeFilter === "fan_zone" ? "#ff8c00" : "#142035"}`,
                  color: typeFilter === "fan_zone" ? "#fff" : "#8899bb",
                  borderRadius: "20px",
                  padding: "7px 16px",
                  fontSize: "13px",
                  fontWeight: typeFilter === "fan_zone" ? 700 : 400,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Fan Zone
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setTooltip(tooltip === "fan_zone" ? null : "fan_zone"); }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6677aa",
                  fontSize: "14px",
                  cursor: "pointer",
                  padding: "2px",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
                aria-label="Información sobre Fan Zone"
              >
                ⓘ
              </button>
            </div>
            {tooltip === "fan_zone" && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                zIndex: 100,
                background: "#0e1a2e",
                border: "1px solid #1e3050",
                borderRadius: "12px",
                padding: "12px 14px",
                fontSize: "12px",
                color: "#c8d8f0",
                lineHeight: 1.5,
                width: "240px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}>
                Espacio local organizado por la comunidad para ver los partidos. Generalmente de entrada libre.
              </div>
            )}
          </div>

        </div>

        {/* Fila 2: filtro por país */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {([
            { key: "mexico", label: "🇲🇽 México" },
            { key: "usa",    label: "🇺🇸 USA" },
            { key: "canada", label: "🇨🇦 Canadá" },
          ] as const).map(({ key, label }) => {
            const active = countryFilter === key;
            return (
              <button
                key={key}
                onClick={() => setCountryFilter(key)}
                style={{
                  background: active ? "#ff8c00" : "#0a1220",
                  border: `1px solid ${active ? "#ff8c00" : "#142035"}`,
                  color: active ? "#fff" : "#8899bb",
                  borderRadius: "20px",
                  padding: "7px 16px",
                  fontSize: "13px",
                  fontWeight: active ? 700 : 400,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ color: "#8899bb", fontSize: "13px", textAlign: "center", paddingTop: "40px" }}>
            Cargando eventos…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ color: "#8899bb", fontSize: "13px", textAlign: "center", paddingTop: "40px" }}>
            No hay eventos disponibles.
          </div>
        ) : (
          filtered.map((zone) => (
            <FanZoneCard
              key={zone.id}
              zone={zone}
              isSaved={savedIds.has(zone.id)}
              onToggleSave={handleToggleSave}
              userLat={userLat}
              userLng={userLng}
            />
          ))
        )}

        <div style={{ height: "80px" }} />
      </div>

      <BottomNav />
    </main>
  );
}
