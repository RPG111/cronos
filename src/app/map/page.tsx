// src/app/map/page.tsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getPublishedEvents, type CronosEvent } from "../../lib/firestore/events";
import { fmtDateShort } from "../../lib/events";
import BottomNav from "../../components/BottomNav";

const MapWithNoSSR = dynamic(() => import("./map-inner"), { ssr: false });

export default function MapPage() {
  const [events, setEvents] = useState<CronosEvent[]>([]);

  useEffect(() => {
    getPublishedEvents().then(setEvents);
  }, []);

  return (
    <main style={{ minHeight: "100dvh", background: "#080c14" }}>
      {/* Header */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "#060a10",
        borderBottom: "1px solid #142035",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
      }}>
        <Link href="/home" className="logo-cronos select-none" />
      </header>

      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "24px 16px" }}>
        <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#e8f0ff", margin: 0 }}>
          Mapa de eventos
        </h2>
        <p style={{ color: "#8899bb", marginTop: "4px", fontSize: "13px" }}>
          Encuentra eventos cerca de ti.
        </p>

        <div style={{ marginTop: "20px", borderRadius: "18px", overflow: "hidden", border: "1px solid #142035", height: "500px" }}>
          <MapWithNoSSR events={events} />
        </div>

        <div style={{ height: "80px" }} />
      </div>

      <BottomNav />
    </main>
  );
}
