"use client";

import { useState } from "react";

interface MetalButtonCSSProps {
  label: string;
  onClick?: () => void;
}

export function MetalButtonCSS({ label, onClick }: MetalButtonCSSProps) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        height: "46px",
        minWidth: "142px",
        padding: "0 20px",
        borderRadius: "100px",
        border: "1px solid",
        borderColor: hovered ? "#666" : "#444",
        background: "linear-gradient(180deg, #2a2a2a 0%, #111 50%, #1a1a1a 100%)",
        color: "#ccc",
        fontSize: "14px",
        fontWeight: 500,
        letterSpacing: "0.01em",
        textShadow: "0 1px 2px rgba(0,0,0,0.8)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        boxShadow: pressed
          ? "inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04)"
          : "inset 0 -1px 0 rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 6px rgba(0,0,0,0.4)",
        transform: pressed
          ? "scale(0.97) translateY(1px)"
          : "scale(1) translateY(0)",
        filter: hovered && !pressed ? "brightness(1.2)" : "brightness(1)",
        transition: "filter 200ms ease, transform 120ms ease, box-shadow 120ms ease, border-color 200ms ease",
        outline: "none",
      }}
    >
      {label}
    </button>
  );
}
