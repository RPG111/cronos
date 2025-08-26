// src/components/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const path = usePathname();

  const item = (href: string, label: string, icon?: string) => {
    const active = path?.startsWith(href);
    return (
      <Link
        href={href}
        className={`flex flex-col items-center justify-center rounded-xl px-4 py-2
          ${active ? "bg-emerald-600 text-white" : "bg-white/10 text-white/80 hover:bg-white/15"}
        `}
      >
        <span className="text-lg leading-none">{icon ?? "•"}</span>
        <span className="text-xs">{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* espacio para que el contenido no quede oculto detrás del nav */}
      <div className="h-24" />
      <nav
        className="
          fixed bottom-0 inset-x-0 z-40
          border-t border-white/10
          bg-black/70 backdrop-blur
          supports-[backdrop-filter]:bg-black/60
        "
      >
        <div className="mx-auto grid max-w-xl grid-cols-3 gap-3 px-4 py-3">
          {item("/picks", "Quinielas", "✚")}
          {item("/home", "Home", "🏠")}
          {item("/profile", "Perfil", "👤")}
        </div>
        {/* safe area iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  );
}
