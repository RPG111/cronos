// src/components/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const path = usePathname();

  const Item = (href: string, emoji: string, label: string) => {
    const active = path?.startsWith(href);
    return (
      <Link
        href={href}
        className={[
          "flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
          active
            ? "bg-emerald-600/90 text-white shadow"
            : "bg-white/10 text-white/85 hover:bg-white/15"
        ].join(" ")}
      >
        <span className="text-base leading-none">{emoji}</span>
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* separador para que el contenido no quede debajo del nav */}
      <div className="h-28" />

      {/* barra flotante tipo “pastilla” centrada */}
      <nav
        className="
          fixed bottom-3 inset-x-0 z-40
          flex justify-center pointer-events-none
        "
        aria-label="Navegación inferior"
      >
        <div
          className="
            pointer-events-auto
            flex items-center gap-2
            rounded-full border border-white/15
            bg-black/35 backdrop-blur-md
            shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]
            px-3 py-2
          "
          // ancho contenido (no ocupa toda la pantalla)
        >
          {Item("/picks", "🎫", "Quinielas")}
          {Item("/home", "🏠", "Home")}
          {Item("/profile", "👤", "Perfil")}
        </div>

        {/* safe area para iPhone */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  );
}
