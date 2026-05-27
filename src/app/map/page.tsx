// src/app/map/page.tsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getActiveFanZones, type FanZone } from "../../lib/firestore/fanzones";
import { useGeoStore } from "../../lib/store";
import { useTranslation } from "../../lib/i18n";
import BottomNav from "../../components/BottomNav";

const MapWC2026Inner = dynamic(
  () => import("./map-wc2026-inner"),
  { ssr: false }
);

export default function MapPage() {
  const [zones, setZones] = useState<FanZone[]>([]);
  const { userLat, userLng } = useGeoStore();
  const t = useTranslation();

  useEffect(() => {
    getActiveFanZones().then(setZones).catch(console.error);
  }, []);

  return (
    <main style={{ minHeight: "100dvh", background: "#09080f" }}>
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "#060a10",
        borderBottom: "1px solid #2a2010",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
      }}>
        <Link href="/home" className="logo-cronos select-none" />
      </header>

      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "24px 16px" }}>
        <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#f0f4ff", margin: 0 }}>
          {t.map.title}
        </h2>
        <p style={{ color: "#8a7a50", marginTop: "4px", fontSize: "13px" }}>
          {userLat != null ? t.map.nearYou : t.map.worldwide}
        </p>

        <div style={{ marginTop: "20px", borderRadius: "18px", overflow: "hidden", border: "1px solid #2a2010", height: "500px" }}>
          <MapWC2026Inner zones={zones} userLat={userLat} userLng={userLng} />
        </div>

        <div style={{ height: "80px" }} />
      </div>

      <BottomNav />
    </main>
  );
}
