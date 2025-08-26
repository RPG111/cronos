"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 👇 Cambia estos emojis si quieres afinar el look
const EMOJI_Q = "⟠"; // usa el que tenías antes para Quinielas
const EMOJI_HOME = "🏠";
const EMOJI_USER = "👤";

export default function BottomNav() {
  const path = usePathname();
  const is = (p: string) => (path === p || path?.startsWith(p));

  const Item = (href: string, emoji: string, label: string, active: boolean) => (
    <Link
      href={href}
      className={[
        "flex w-full flex-col items-center justify-center rounded-[20px] px-5 py-4 transition",
        active
          ? "bg-emerald-800/50 ring-2 ring-emerald-500/50 text-emerald-200"
          : "text-white"
      ].join(" ")}
    >
      <span className="text-xl leading-none">{emoji}</span>
      <span className="mt-1 text-[15px] font-medium">{label}</span>
    </Link>
  );

  return (
    <>
      {/* separador para que el contenido no quede debajo del nav */}
      <div className="h-28" />

      {/* barra tipo tarjeta grande, centrada y con “vidrio” */}
      <nav
        className="
          fixed bottom-4 left-1/2 z-40 -translate-x-1/2
          w-[min(92%,780px)]
          rounded-[28px] border border-white/15
          bg-black/55 backdrop-blur-md
          shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]
          px-3 py-3
        "
        aria-label="Navegación inferior"
      >
        <div className="grid grid-cols-3 gap-3">
          {Item("/picks", EMOJI_Q, "Quinielas", is("/picks"))}
          {Item("/home", EMOJI_HOME, "Home", is("/home") || path === "/")}
          {Item("/profile", EMOJI_USER, "Perfil", is("/profile"))}
        </div>
      </nav>

      {/* safe area para iPhone */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </>
  );
}
