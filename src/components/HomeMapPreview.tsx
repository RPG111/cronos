"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { FanZone } from "@/lib/firestore/fanzones";

const pinIcon = L.divIcon({
  html: `<div style="
    width:12px;height:12px;
    background:#f0c040;
    border-radius:50%;
    border:2px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.5);
  "></div>`,
  className: "",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -10],
});

export default function HomeMapPreview({ zones }: { zones: FanZone[] }) {
  return (
    <MapContainer
      center={[37.7749, -122.4194]}
      zoom={5}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      />
      {zones.map((zone) => (
        <Marker key={zone.id} position={[zone.lat, zone.lng]} icon={pinIcon}>
          <Popup>
            <div style={{ minWidth: "180px", fontFamily: "system-ui, sans-serif" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: "2px", lineHeight: 1.3 }}>
                {zone.name}
              </div>
              <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "6px" }}>
                {zone.city}
              </div>
              <div style={{ fontSize: "11px", color: "#374151" }}>
                📅 {zone.datesOpen}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
