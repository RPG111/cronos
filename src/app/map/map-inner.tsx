// src/app/map/map-inner.tsx
"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { type CronosEvent } from "../../lib/firestore/events";
import { fmtDateShort } from "../../lib/events";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Props = { events: CronosEvent[] };

export default function MapInner({ events }: Props) {
  return (
    <MapContainer
      center={[37.7749, -122.4194]}
      zoom={11}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      />
      {events
        .filter((ev) => ev.lat && ev.lng)
        .map((ev) => (
          <Marker key={ev.id} position={[ev.lat, ev.lng]}>
            <Popup>
              <div style={{ minWidth: "180px" }}>
                <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>
                  {ev.title}
                </div>
                <div style={{ fontSize: "12px", color: "#555", marginBottom: "2px" }}>
                  {ev.venueName}
                </div>
                <div style={{ fontSize: "12px", color: "#555", marginBottom: "2px" }}>
                  {fmtDateShort(ev.dateISO)}
                </div>
                <div style={{ fontSize: "12px", color: "#555", marginBottom: "8px" }}>
                  {ev.attendees ?? 0} asistentes
                </div>
                <Link
                  href={`/events/${ev.id}`}
                  style={{
                    display: "inline-block",
                    background: "#00ff9d",
                    color: "#060a10",
                    fontWeight: 700,
                    fontSize: "12px",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    textDecoration: "none",
                  }}
                >
                  Ver evento
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
