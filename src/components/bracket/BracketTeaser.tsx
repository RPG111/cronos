"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Props {
  isLoggedIn: boolean;
}

export default function BracketTeaser({ isLoggedIn }: Props) {
  const t = useTranslation();
  const b = t.bracket;

  const points = [
    b.pointsR32,
    b.pointsR16,
    b.pointsQF,
    b.pointsSF,
    b.pointsThird,
    b.pointsFinal,
  ];

  return (
    <div className="flex flex-col items-center px-4 pt-6 pb-28 gap-6">
      {/* Hero */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 72, height: 72, background: "rgba(240,192,64,0.12)", border: "1.5px solid rgba(240,192,64,0.35)" }}
        >
          <Trophy size={34} style={{ color: "#f0c040" }} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{b.title}</h1>
        <div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold"
          style={{ background: "rgba(240,192,64,0.15)", border: "1px solid rgba(240,192,64,0.4)", color: "#f0c040" }}
        >
          <Trophy size={14} />
          {b.prizeLabel}: {b.prize}
        </div>
      </div>

      {/* Fecha de apertura */}
      <p
        className="text-center text-sm rounded-xl px-4 py-3 max-w-sm"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "#a0905a" }}
      >
        {b.opensOn}
      </p>

      {/* Cómo funciona */}
      <div
        className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
      >
        <h2 className="font-semibold text-white text-base">{b.howItWorks}</h2>
        <p className="text-sm leading-relaxed" style={{ color: "#c0aa78" }}>
          {b.howItWorksText}
        </p>

        {/* Tabla de puntos */}
        <div className="flex flex-col gap-1.5 mt-1">
          {points.map((p) => (
            <div
              key={p}
              className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
              style={{ background: "rgba(240,192,64,0.07)", color: "#d4aa58" }}
            >
              <span
                className="inline-block rounded-full"
                style={{ width: 6, height: 6, background: "#f0c040", flexShrink: 0 }}
              />
              {p}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="w-full max-w-sm">
        {isLoggedIn ? (
          <div
            className="w-full text-center rounded-2xl py-4 text-sm font-medium"
            style={{ background: "rgba(240,192,64,0.08)", border: "1px solid rgba(240,192,64,0.25)", color: "#f0c040" }}
          >
            {b.ctaLoggedIn}
          </div>
        ) : (
          <Link
            href="/auth/register"
            className="block w-full text-center rounded-2xl py-4 text-sm font-bold transition-opacity hover:opacity-90 active:opacity-75"
            style={{ background: "#f0c040", color: "#060a10" }}
          >
            {b.ctaRegister}
          </Link>
        )}
        {!isLoggedIn && (
          <p className="text-center text-xs mt-2" style={{ color: "#6a5a35" }}>
            {b.free}
          </p>
        )}
      </div>
    </div>
  );
}
