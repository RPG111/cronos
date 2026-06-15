"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import { useTranslation } from "../../lib/i18n";

// Colors per blob index
const BLOB_COLORS = ["#eaf1fb", "#aebccf", "#cdd9ea"] as const;

function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
) {
  // 1. Diagonal background gradient
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#3a4658");
  bg.addColorStop(0.5, "#7e8da3");
  bg.addColorStop(1, "#2c3543");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // 2. Three blobs in 'lighter' composite
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 3; i++) {
    const ox = w * (0.5 + 0.32 * Math.sin(t * 0.7 + i * 2.1));
    const oy = h * (0.5 + 0.4 * Math.cos(t * 0.55 + i * 1.7));
    const rad = Math.min(w, h) * (0.55 + 0.18 * Math.sin(t * 0.9 + i));
    const rg = ctx.createRadialGradient(ox, oy, 0, ox, oy, rad);
    rg.addColorStop(0, BLOB_COLORS[i]);
    rg.addColorStop(1, "rgba(60,72,90,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h);
  }

  // 3. Reset composite
  ctx.globalCompositeOperation = "source-over";

  // 4. Diagonal sheen
  const sx = w * (0.5 + 0.5 * Math.sin(t * 0.4));
  const sy = h * (0.5 + 0.5 * Math.cos(t * 0.35));
  const sheen = ctx.createLinearGradient(sx - w * 0.3, sy - h * 0.3, sx + w * 0.3, sy + h * 0.3);
  sheen.addColorStop(0, "rgba(255,255,255,0)");
  sheen.addColorStop(0.45, "rgba(255,255,255,0.07)");
  sheen.addColorStop(0.5, "rgba(255,255,255,0.14)");
  sheen.addColorStop(0.55, "rgba(255,255,255,0.07)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);
}

export default function BracketHeroBanner() {
  const router = useRouter();
  const t = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);

    function resize() {
      if (!canvas) return;
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx!.scale(dpr, dpr);
    }

    resize();

    if (prefersReducedMotion) {
      const { width, height } = canvas.getBoundingClientRect();
      drawFrame(ctx, width, height, 0);
      return;
    }

    function loop() {
      if (!canvas) return;
      tRef.current += 0.012;
      const { width, height } = canvas.getBoundingClientRect();
      // Reset transform before drawing (scale is cumulative otherwise)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawFrame(ctx!, width, height, tRef.current);
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${t.bracket.title} — ${t.bracket.heroTitle} ${t.bracket.prize}`}
      onClick={() => router.push("/bracket")}
      onKeyDown={(e) => e.key === "Enter" && router.push("/bracket")}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        position: "relative",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid rgba(180,200,230,0.25)",
        padding: "20px",
        cursor: "pointer",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition: "transform 0.12s ease",
        marginBottom: "24px",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        minHeight: "140px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* Canvas background */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          display: "block",
        }}
      />

      {/* Darkening overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background:
            "linear-gradient(105deg, rgba(6,10,16,0.55), rgba(6,10,16,0.25) 45%, rgba(6,10,16,0.6))",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          textAlign: "center",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: "20px",
            padding: "5px 12px",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <Trophy size={12} color="#ffe9a8" strokeWidth={2} />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.8px",
              color: "#e8f0ff",
            }}
          >
            {t.bracket.title.toUpperCase()}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "21px",
            fontWeight: 500,
            color: "#ffffff",
            lineHeight: 1.25,
          }}
        >
          {t.bracket.heroTitle}{" "}
          <span style={{ color: "#ffe9a8" }}>{t.bracket.prize}</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "12px",
            color: "rgba(200,215,240,0.8)",
            letterSpacing: "0.2px",
          }}
        >
          {t.bracket.heroSub}
        </div>

        {/* Button */}
        <div
          style={{
            marginTop: "4px",
            background: "linear-gradient(180deg, #ffffff, #dfe8f5)",
            color: "#1a2030",
            fontSize: "13px",
            fontWeight: 700,
            padding: "9px 22px",
            borderRadius: "20px",
            letterSpacing: "0.3px",
          }}
        >
          {t.bracket.heroBtn} →
        </div>
      </div>
    </div>
  );
}
