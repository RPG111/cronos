// src/components/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = "picks" | "home" | "profile";

export default function BottomNav() {
  const pathname = usePathname();
  const active: Tab =
    pathname?.startsWith("/profile") ? "profile" :
    pathname?.startsWith("/picks") ? "picks" :
    "home";

  const base =
    "flex flex-col items-center justify-center gap-1 flex-1 px-3 py-2 rounded-xl transition";
  const activeCls =
    "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30";
  const idleCls = "text-zinc-200 hover:bg-white/5";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50">
      {/* Contenedor centrado, ancho tipo móvil y con safe-area abajo */}
      <div
        className="mx-auto w-full max-w-[480px] px-4"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mb-3 rounded-2xl border border-white/10 bg-zinc-900/80 p-2 backdrop-blur shadow-lg">
          <div className="flex items-center gap-2">
            <Link
              href="/picks"
              className={`${base} ${active === "picks" ? activeCls : idleCls}`}
              aria-label="Quinielas"
              aria-current={active === "picks" ? "page" : undefined}
            >
              {/* Moneda */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M12 7v10m-3-2.5c1.2.9 4.8.9 6 0m-6-5c1.2-.9 4.8-.9 6 0"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-[11px]">Quinielas</span>
            </Link>

            <Link
              href="/home"
              className={`${base} ${active === "home" ? activeCls : idleCls}`}
              aria-label="Home"
              aria-current={active === "home" ? "page" : undefined}
            >
              {/* Casa */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[11px]">Home</span>
            </Link>

            <Link
              href="/profile"
              className={`${base} ${active === "profile" ? activeCls : idleCls}`}
              aria-label="Perfil"
              aria-current={active === "profile" ? "page" : undefined}
            >
              {/* Usuario */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M5 19.5c1.6-3.2 5.4-3.5 7-3.5s5.4.3 7 3.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-[11px]">Perfil</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Espaciador: altura del navbar + safe area para que no tape contenido */}
      <div
        style={{ height: "calc(64px + env(safe-area-inset-bottom))" }}
        aria-hidden
      />
    </nav>
  );
}
