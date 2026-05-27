// src/app/map/map-wc2026-inner.tsx
"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { FanZone } from "../../lib/firestore/fanzones";

// ── Pin naranja personalizado ────────────────────────────────────────────────

const orangeIcon = L.divIcon({
  html: `<div style="
    width:14px;height:14px;
    background:#e63946;
    border-radius:50%;
    border:2px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.5);
  "></div>`,
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -12],
});

const userIcon = L.divIcon({
  html: `<div style="
    width:12px;height:12px;
    background:#3b82f6;
    border-radius:50%;
    border:2px solid #fff;
    box-shadow:0 0 0 4px rgba(59,130,246,0.25);
  "></div>`,
  className: "",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -10],
});

// ── Controller para actualizar la vista al cambiar ubicación ─────────────────

function MapController({
  lat,
  lng,
  zoom,
}: {
  lat: number;
  lng: number;
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom, { animate: true });
  }, [lat, lng, zoom, map]);
  return null;
}

// ── Helpers popup ────────────────────────────────────────────────────────────

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

function PopupContent({ zone }: { zone: FanZone }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(zone.address)}`;
  const isFree = zone.entry.toLowerCase().startsWith("gratuita");
  const registrationLabel =
    zone.entry.toLowerCase().includes("registro") ? "Registrarse" : "Más info";

  return (
    <div style={{ minWidth: "220px", maxWidth: "260px", fontFamily: "system-ui, sans-serif" }}>
      {/* Badge */}
      <div style={{ marginBottom: "6px" }}>
        {zone.type === "fan_festival" ? (
          <span style={{
            display: "inline-block",
            background: "#fef3c7",
            border: "1px solid #f59e0b",
            color: "#92400e",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.4px",
            padding: "2px 7px",
            borderRadius: "20px",
          }}>
            FIFA Fan Festival oficial
          </span>
        ) : (
          <span style={{
            display: "inline-block",
            background: "#dbeafe",
            border: "1px solid #3b82f6",
            color: "#1e40af",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.4px",
            padding: "2px 7px",
            borderRadius: "20px",
          }}>
            Fan Zone
          </span>
        )}
      </div>

      {/* Nombre */}
      <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "3px", lineHeight: 1.3 }}>
        {zone.name}
      </div>

      {/* Ciudad + país */}
      <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>
        {COUNTRY_FLAG[zone.country]} {zone.city}, {COUNTRY_NAME[zone.country]}
      </div>

      {/* Venue */}
      <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "1px" }}>{zone.venue}</div>
      <div style={{ fontSize: "10px", color: "#9ca3af", marginBottom: "8px" }}>{zone.address}</div>

      {/* Fechas + entrada */}
      <div style={{ fontSize: "11px", color: "#374151", marginBottom: "3px" }}>
        📅 {zone.datesOpen}
      </div>
      <div style={{ fontSize: "11px", fontWeight: 600, color: isFree ? "#059669" : "#d97706", marginBottom: "10px" }}>
        🎟 {zone.entry}
      </div>

      {/* Notas */}
      {zone.notes && (
        <div style={{ fontSize: "10px", color: "#9ca3af", fontStyle: "italic", marginBottom: "10px" }}>
          {zone.notes}
        </div>
      )}

      {/* Botones */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {zone.registrationUrl && (
          <a
            href={zone.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "linear-gradient(135deg, #ff6b00, #e63946)",
              color: "#fff",
              fontSize: "11px",
              fontWeight: 700,
              padding: "6px 12px",
              borderRadius: "16px",
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
            background: "#f3f4f6",
            border: "1px solid #d1d5db",
            color: "#374151",
            fontSize: "11px",
            fontWeight: 600,
            padding: "6px 12px",
            borderRadius: "16px",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Cómo llegar
        </a>
        {zone.officialUrl && (
          <a
            href={zone.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#6b7280",
              fontSize: "10px",
              textDecoration: "underline",
              padding: "6px 2px",
              alignSelf: "center",
            }}
          >
            Sitio oficial
          </a>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

type Props = {
  zones: FanZone[];
  userLat: number | null;
  userLng: number | null;
};

export default function MapWC2026Inner({ zones, userLat, userLng }: Props) {
  const hasLocation = userLat != null && userLng != null;

  const centerLat = hasLocation ? userLat! : 39.5;
  const centerLng = hasLocation ? userLng! : -98.35;
  const zoom = hasLocation ? 10 : 4;

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={zoom}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      />

      {/* Actualiza la vista si llega la ubicación después del mount */}
      <MapController lat={centerLat} lng={centerLng} zoom={zoom} />

      {/* Marcador de posición del usuario */}
      {hasLocation && (
        <Marker position={[userLat!, userLng!]} icon={userIcon}>
          <Popup>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e40af" }}>
              Tu ubicación
            </div>
          </Popup>
        </Marker>
      )}

      {/* Pins de Fan Zones */}
      {zones.map((zone) => (
        <Marker key={zone.id} position={[zone.lat, zone.lng]} icon={orangeIcon}>
          <Popup>
            <PopupContent zone={zone} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
