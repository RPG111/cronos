// src/app/fanzones/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app as firebaseApp } from "../../../lib/firebase";
import {
  getFanZoneById,
  saveFanZoneForUser,
  removeFanZoneForUser,
  getSavedFanZoneIds,
  type FanZone,
} from "../../../lib/firestore/fanzones";
import { useLangStore } from "../../../lib/store";
import { useTranslation, translateField } from "../../../lib/i18n";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import RestaurantLead from "@/components/RestaurantLead";
import { Star } from "lucide-react";

const COUNTRY_FLAG: Record<string, string> = {
  usa: "🇺🇸",
  canada: "🇨🇦",
  mexico: "🇲🇽",
};

function TypeBadge({ type, t }: { type: FanZone["type"]; t: ReturnType<typeof useTranslation> }) {
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

export default function FanZoneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [zone, setZone] = useState<FanZone | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);

  const { lang } = useLangStore();
  const t = useTranslation();

  // Auth
  useEffect(() => {
    const auth = getAuth(firebaseApp);
    return onAuthStateChanged(auth, async (u) => {
      setUid(u?.uid ?? null);
      if (u) {
        try {
          const ids = await getSavedFanZoneIds(u.uid);
          setIsSaved(ids.includes(id));
        } catch {}
      } else {
        setIsSaved(false);
      }
    });
  }, [id]);

  // Load fan zone
  useEffect(() => {
    getFanZoneById(id)
      .then((data) => {
        if (!data) setNotFound(true);
        else setZone(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleToggleSave() {
    if (!uid || !zone) return;
    const wasSaved = isSaved;
    setIsSaved(!wasSaved);
    try {
      if (wasSaved) await removeFanZoneForUser(uid, zone.id);
      else await saveFanZoneForUser(uid, zone.id);
    } catch {
      setIsSaved(wasSaved);
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

  const entryColor =
    zone?.entry.toLowerCase().startsWith("gratuita") ||
    zone?.entry.toLowerCase().startsWith("free")
      ? "#00c97a"
      : "#f59e0b";

  const mapsUrl = zone
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(zone.address)}`
    : "";

  const registrationLabel =
    zone?.entry.toLowerCase().includes("registro") ||
    zone?.entry.toLowerCase().includes("register")
      ? t.home.register
      : t.home.moreInfo;

  return (
    <main style={{ minHeight: "100dvh", background: "#09080f" }}>
      <Header
        onOpenLead={() => setLeadOpen(true)}
        isLoggedIn={!!uid}
        onLogout={handleSignOut}
      />
      <RestaurantLead open={leadOpen} onClose={() => setLeadOpen(false)} />

      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "24px 16px" }}>

        {/* Botón volver */}
        <button
          onClick={() => router.push("/home")}
          style={{
            background: "none",
            border: "none",
            color: "#8a7a50",
            fontSize: "14px",
            cursor: "pointer",
            padding: "0 0 20px 0",
            display: "block",
          }}
        >
          {t.detail.back}
        </button>

        {loading && (
          <div style={{ color: "#8a7a50", fontSize: "13px", textAlign: "center", paddingTop: "60px" }}>
            {t.home.loading}
          </div>
        )}

        {notFound && !loading && (
          <div style={{ textAlign: "center", paddingTop: "60px" }}>
            <p style={{ color: "#8a7a50", fontSize: "15px", marginBottom: "20px" }}>
              {t.detail.notFound}
            </p>
            <button
              onClick={() => router.push("/home")}
              style={{
                background: "#f0c040",
                border: "none",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 700,
                padding: "10px 24px",
                borderRadius: "20px",
                cursor: "pointer",
              }}
            >
              {t.detail.notFoundBtn}
            </button>
          </div>
        )}

        {zone && !loading && (
          <>
            {/* Badge + estrella */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "12px" }}>
              <TypeBadge type={zone.type} t={t} />
              <button
                onClick={handleToggleSave}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 0", flexShrink: 0, lineHeight: 1 }}
                aria-label={isSaved ? t.home.ariaFavRemove : t.home.ariaFavAdd}
              >
                <Star
                  size={20}
                  strokeWidth={1.5}
                  fill={isSaved ? "#f59e0b" : "none"}
                  stroke={isSaved ? "#f59e0b" : "#8a7a50"}
                />
              </button>
            </div>

            {/* Nombre */}
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f0f4ff", margin: "0 0 8px 0", lineHeight: 1.3 }}>
              {zone.name}
            </h1>

            {/* Ciudad + país */}
            <div style={{ fontSize: "14px", color: "#8a7a50", marginBottom: "20px" }}>
              {COUNTRY_FLAG[zone.country]} {zone.city},{" "}
              {t.home.countries[zone.country as keyof typeof t.home.countries] ?? zone.country}
            </div>

            {/* Mapa embed */}
            <div style={{ marginBottom: "20px", borderRadius: "16px", overflow: "hidden" }}>
              <iframe
                src={`https://www.google.com/maps?q=${zone.lat},${zone.lng}&z=15&output=embed`}
                width="100%"
                height="220"
                style={{ border: "none", display: "block" }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Venue + dirección */}
            <div style={{ background: "#110f1a", border: "1px solid #2a2010", borderRadius: "16px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#c8d8f0", marginBottom: "4px" }}>
                {zone.venue}
              </div>
              <div style={{ fontSize: "12px", color: "#4a5a7a" }}>
                {zone.address}
              </div>
            </div>

            {/* Fechas + entrada */}
            <div style={{ background: "#110f1a", border: "1px solid #2a2010", borderRadius: "16px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", color: "#ffffff", marginBottom: "8px" }}>
                📅 {translateField(zone.datesOpen, lang)}
              </div>
              <div style={{ fontSize: "13px", color: entryColor, fontWeight: 600 }}>
                🎟 {translateField(zone.entry, lang)}
              </div>
            </div>

            {/* Notas */}
            {zone.notes && (
              <div style={{
                background: "#110f1a",
                border: "1px solid #2a2010",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "16px",
                fontSize: "12px",
                color: "#ffffff",
                fontStyle: "italic",
                lineHeight: 1.6,
              }}>
                {translateField(zone.notes, lang)}
              </div>
            )}

            {/* ¿Qué encontrarás? */}
            {(zone.alcohol != null || zone.food || zone.amenities) && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#8a7a50", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                  {lang === "en" ? "What to expect?" : "¿Qué encontrarás?"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {zone.food && (
                    <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#c8d8f0", marginBottom: "4px" }}>🍔 {lang === "en" ? "Food" : "Comida"}</div>
                      <div style={{ fontSize: "13px", color: "#8a7a50", lineHeight: 1.5 }}>{zone.food}</div>
                    </div>
                  )}
                  {zone.alcohol != null && (
                    <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#c8d8f0", marginBottom: "4px" }}>🍺 {lang === "en" ? "Drinks" : "Bebidas"}</div>
                      <div style={{ fontSize: "13px", color: "#8a7a50", lineHeight: 1.5 }}>
                        {zone.alcohol
                          ? (lang === "en" ? "Alcoholic beverages available" : "Bebidas alcohólicas disponibles")
                          : (lang === "en" ? "Alcohol-free event" : "Evento sin alcohol")}
                      </div>
                    </div>
                  )}
                  {zone.amenities && (
                    <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#c8d8f0", marginBottom: "4px" }}>🪩 {lang === "en" ? "Amenities" : "Amenidades"}</div>
                      <div style={{ fontSize: "13px", color: "#8a7a50", lineHeight: 1.5 }}>{zone.amenities}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botones */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  textAlign: "center",
                  background: "rgba(192,192,192,0.07)",
                  border: "1px solid rgba(192,192,192,0.2)",
                  color: "#c8d8f0",
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: "12px 20px",
                  borderRadius: "20px",
                  textDecoration: "none",
                }}
              >
                {t.home.howToGet}
              </a>

              {zone.registrationUrl && (
                <a
                  href={zone.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    textAlign: "center",
                    background: "linear-gradient(135deg, #f0c040, #f0c040)",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: 700,
                    padding: "12px 20px",
                    borderRadius: "20px",
                    textDecoration: "none",
                  }}
                >
                  {registrationLabel}
                </a>
              )}

              {zone.officialUrl && (
                <a
                  href={zone.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    textAlign: "center",
                    background: "none",
                    border: "1px solid #2a2010",
                    color: "#8a7a50",
                    fontSize: "14px",
                    fontWeight: 600,
                    padding: "12px 20px",
                    borderRadius: "20px",
                    textDecoration: "none",
                  }}
                >
                  {t.home.officialSite}
                </a>
              )}
            </div>
          </>
        )}

        <div style={{ height: "80px" }} />
      </div>

      <BottomNav />
    </main>
  );
}
