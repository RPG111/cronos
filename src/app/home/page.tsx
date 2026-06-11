// src/app/home/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { useGeoStore, useLangStore } from "../../lib/store";
import { useTranslation, translateField, type Translations } from "../../lib/i18n";
import BottomNav from "../../components/BottomNav";
import Header from "@/components/Header";
import RestaurantLead from "@/components/RestaurantLead";
import { Star } from "lucide-react";

// ── Country helpers ──────────────────────────────────────────────────────────


function formatCountry(country: string, t: ReturnType<typeof useTranslation>): string {
  if (country === "bay_area") return "Bay Area";
  return t.home.countries[country as keyof typeof t.home.countries] ?? country;
}

// ── Date helpers ─────────────────────────────────────────────────────────────

function isoFromToday(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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

function TypeBadge({ type, t }: { type: FanZone["type"]; t: Translations }) {
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
        {t.home.fanFestivalBadge}
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
      {t.home.fanZoneBadge}
    </span>
  );
}

// ── Fan Zone Card ────────────────────────────────────────────────────────────

function FanZoneCard({
  zone,
  isSaved,
  onToggleSave,
  onCardClick,
  userLat,
  userLng,
}: {
  zone: FanZone;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onCardClick: (id: string) => void;
  userLat: number | null;
  userLng: number | null;
}) {
  const t = useTranslation();
  const { lang } = useLangStore();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(zone.address)}`;
  const dist =
    userLat != null && userLng != null
      ? distanceKm(userLat, userLng, zone.lat, zone.lng)
      : null;

  const countryName = formatCountry(zone.country, t);

  return (
    <div
      className="card-chrome-wrap"
      onClick={() => onCardClick(zone.id)}
      style={{ marginBottom: "12px", cursor: "pointer" }}
    >
      <div style={{ background: "#110f1a", borderRadius: "18px", padding: "14px" }}>
        {/* Top: badge + estrella */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
          <TypeBadge type={zone.type} t={t} />
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSave(zone.id); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 0", flexShrink: 0, lineHeight: 1 }}
            aria-label={isSaved ? t.home.ariaFavRemove : t.home.ariaFavAdd}
          >
            <Star
              size={17}
              strokeWidth={1.5}
              fill={isSaved ? "#f59e0b" : "none"}
              stroke={isSaved ? "#f59e0b" : "#8a7a50"}
            />
          </button>
        </div>

        {/* Nombre */}
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#f0f4ff", marginBottom: "4px", lineHeight: 1.3 }}>
          {zone.name}
        </div>

        {/* Ciudad + país + distancia */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
          <span style={{ fontSize: "13px", color: "#8a7a50" }}>
            {zone.city}, {countryName}
          </span>
          {dist != null && (
            <span style={{
              fontSize: "11px",
              color: "#f0c040",
              background: "rgba(240,192,64,0.1)",
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
        <div style={{ height: "1px", background: "#2a2010", marginBottom: "10px" }} />

        {/* Fechas */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
          <span style={{ fontSize: "12px", color: "#8a7a50" }}>
            📅 {translateField(zone.datesOpen, lang)}
          </span>
        </div>

        {/* Notas */}
        {zone.notes && (
          <div style={{ fontSize: "11px", color: "#ffffff", fontStyle: "italic", marginBottom: "10px" }}>
            {translateField(zone.notes, lang)}
          </div>
        )}

        {/* Badges minimalistas */}
        {zone.status === "coming_soon" ? (
          <div style={{ display: "flex", marginBottom: "10px" }}>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(30,60,120,0.4)", border: "1px solid rgba(100,150,255,0.25)", color: "#8aabdd", whiteSpace: "nowrap" }}>
              🔜 Próximamente
            </span>
          </div>
        ) : (zone.food || zone.alcohol != null || zone.entry) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
            {zone.food && (
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#c8d8f0", whiteSpace: "nowrap" }}>
                🍔 Comida disponible
              </span>
            )}
            {zone.alcohol === true && (
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#c8d8f0", whiteSpace: "nowrap" }}>
                🍺 Alcohol disponible
              </span>
            )}
            {zone.alcohol === false && (
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#c8d8f0", whiteSpace: "nowrap" }}>
                🚫 Sin alcohol
              </span>
            )}
            {zone.entry && (() => {
              const e = zone.entry.toLowerCase();
              const isGratis = e.includes("gratis") || e.includes("gratuita") || e.includes("free");
              const isRegistro = e.includes("registro") || e.includes("rsvp") || e.includes("ticket");
              const priceMatch = zone.entry.match(/\$[\d,.]+/);
              let label: string;
              if (priceMatch) label = `📋 Requiere registro · ${priceMatch[0]}`;
              else if (isGratis && isRegistro) label = "📋 Gratis · Requiere registro";
              else if (isGratis) label = "💰 Gratis · Walk-in";
              else label = `📋 Requiere registro`;
              return (
                <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#c8d8f0", whiteSpace: "nowrap" }}>
                  {label}
                </span>
              );
            })()}
          </div>
        )}

        {/* Botones */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {(zone.registrationUrl || zone.officialUrl) && (
            <a
              href={zone.registrationUrl ?? zone.officialUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "linear-gradient(135deg, #f0c040, #f0c040)",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 700,
                padding: "8px 14px",
                borderRadius: "20px",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {zone.registrationUrl ? t.home.registerHere : t.home.moreInfo}
            </a>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
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
            {t.home.howToGet}
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const [zones, setZones] = useState<FanZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentFilter, setTournamentFilter] = useState<"champions_2026" | "world_cup_2026">("world_cup_2026");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [leadOpen, setLeadOpen] = useState(false);

  const { userLat, userLng } = useGeoStore();
  const countdown = useCountdown();
  const [mounted, setMounted] = useState(false);
  const t = useTranslation();

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
    return [...zones].sort((a, b) => a.city.localeCompare(b.city));
  }, [zones, userLat, userLng]);

  // Filtro por torneo + fecha + búsqueda
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sorted.filter((z) => {
      const zt = z.tournament ?? "world_cup_2026";
      if (zt !== tournamentFilter) return false;
      if (dateFilter) {
        if (!z.startDate || !z.endDate) return false;
        if (dateFilter < z.startDate || dateFilter > z.endDate) return false;
      }
      if (q) {
        const haystack = `${z.name} ${z.city} ${z.venue}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [sorted, dateFilter, searchQuery, tournamentFilter]);

  async function handleToggleSave(id: string) {
    if (!uid) { alert(t.home.loginToSave); return; }
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
    <main style={{ minHeight: "100dvh", background: "#09080f" }}>
      <Header
        onOpenLead={() => setLeadOpen(true)}
        isLoggedIn={!!uid}
        onLogout={handleSignOut}
      />
      <RestaurantLead open={leadOpen} onClose={() => setLeadOpen(false)} />

      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "24px 16px" }}>

        {/* ── Sección 1: Banner ── */}
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#f0f4ff", margin: 0, lineHeight: 1.3 }}>
            {t.home.bannerTitle}
          </h2>
          <p style={{ color: "#8a7a50", marginTop: "6px", fontSize: "13px" }}>
            {t.home.bannerSubtitle}
          </p>

          {mounted && countdown && (
            <div style={{
              marginTop: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
              background: "rgba(240,192,64,0.08)",
              border: "1px solid rgba(240,192,64,0.2)",
              borderRadius: "12px",
              padding: "6px 12px",
            }}>
              <span style={{ fontSize: "11px", color: "#8a7a50", marginRight: "6px" }}>{t.home.countdownLabel}</span>
              {[
                { v: countdown.days, l: t.home.countdownUnits.days },
                { v: countdown.hours, l: t.home.countdownUnits.hours },
                { v: countdown.mins, l: t.home.countdownUnits.mins },
                { v: countdown.secs, l: t.home.countdownUnits.secs },
              ].map(({ v, l }) => (
                <span key={l} style={{ fontSize: "13px", color: "#f0c040", fontWeight: 700, fontVariantNumeric: "tabular-nums", marginRight: "4px" }}>
                  {String(v).padStart(2, "0")}{l}
                </span>
              ))}
            </div>
          )}

        </div>

        {/* ── Sección 2: Selector de torneo ── */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          {([
            // HIDDEN — restaurar cuando se reactive Champions League
            // { key: "champions_2026", label: "Champions League" },
            { key: "world_cup_2026", label: "World Cup 2026" },
          ] as const).map(({ key, label }) => {
            const active = tournamentFilter === key;
            return (
              <div key={key} className="card-chrome-wrap" style={{ borderRadius: "20px", flex: 1 }}>
                <button
                  onClick={() => {
                    setTournamentFilter(key);
                    setDateFilter(null);
                    setSearchQuery("");
                  }}
                  style={active ? {
                    background: "#110f1a",
                    borderRadius: "20px",
                    padding: "11px 28px",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#f0c040",
                    border: "none",
                    cursor: "pointer",
                    width: "100%",
                  } : {
                    background: "#09080f",
                    borderRadius: "20px",
                    padding: "11px 28px",
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "#8a7a50",
                    border: "none",
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  <span style={{
                    color: "#ffffff",
                    fontWeight: 700,
                    ...(active ? {} : { opacity: 0.6 }),
                  }}>
                    {label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Sección 3: Filtros + Lista ── */}

        {/* Buscador */}
        <style>{`.fz-search::placeholder { color: #4a5a7a; }`}</style>
        <div style={{ position: "relative", marginBottom: "12px" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.home.searchPlaceholder}
            className="fz-search"
            style={{
              width: "100%",
              background: "#110f1a",
              border: "1px solid #2a2010",
              color: "#f0f4ff",
              borderRadius: "12px",
              padding: "10px 40px 10px 14px",
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label={t.home.searchClear}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#4a5a7a",
                cursor: "pointer",
                fontSize: "16px",
                lineHeight: 1,
                padding: "4px",
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtro por fecha */}
        <style>{`.fz-date::-webkit-calendar-picker-indicator { filter: invert(0.4) sepia(1) hue-rotate(180deg); cursor: pointer; }`}</style>
        <div style={{ marginBottom: "16px" }}>
          {/* Chips rápidos */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
            {(["Hoy", "Mañana"] as const).map((label, i) => {
              const iso = isoFromToday(i);
              const active = dateFilter === iso;
              return (
                <button
                  key={label}
                  onClick={() => setDateFilter(active ? null : iso)}
                  style={{
                    background: active ? "#f0c040" : "#110f1a",
                    border: `1px solid ${active ? "#f0c040" : "#2a2010"}`,
                    color: active ? "#111" : "#8a7a50",
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
            {dateFilter && (
              <button
                onClick={() => setDateFilter(null)}
                aria-label="Limpiar filtro de fecha"
                style={{
                  background: "none",
                  border: "1px solid #2a2010",
                  color: "#6677aa",
                  borderRadius: "20px",
                  padding: "7px 12px",
                  fontSize: "13px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  marginLeft: "auto",
                }}
              >
                ✕ Limpiar
              </button>
            )}
          </div>
          {/* Selector de fecha — abre picker nativo en iOS/Android */}
          <input
            type="date"
            min="2026-06-11"
            max="2026-07-19"
            value={dateFilter ?? ""}
            onChange={(e) => setDateFilter(e.target.value || null)}
            className="fz-date"
            style={{
              width: "100%",
              background: "#110f1a",
              border: `1px solid ${dateFilter ? "#f0c040" : "#2a2010"}`,
              color: dateFilter ? "#f0c040" : "#4a5a7a",
              borderRadius: "12px",
              padding: "10px 14px",
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box",
              cursor: "pointer",
            }}
          />
        </div>

        {loading ? (
          <div style={{ color: "#8a7a50", fontSize: "13px", textAlign: "center", paddingTop: "40px" }}>
            {t.home.loading}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ color: "#8a7a50", fontSize: "13px", textAlign: "center", paddingTop: "40px" }}>
            {t.home.noEvents}
          </div>
        ) : (
          filtered.map((zone) => (
            <FanZoneCard
              key={zone.id}
              zone={zone}
              isSaved={savedIds.has(zone.id)}
              onToggleSave={handleToggleSave}
              onCardClick={(id) => router.push(`/fanzones/${id}`)}
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
