// src/components/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, CircleDollarSign } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const links = [
    { href: "/picks", label: "Quinielas", icon: CircleDollarSign },
    { href: "/home", label: "Home", icon: Home },
    { href: "/profile", label: "Perfil", icon: User },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2">
      <div className="flex justify-around rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md shadow-lg">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition ${
                active
                  ? "bg-emerald-600/20 text-emerald-400"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Icon
                size={18} // 🔹 25% más chico que antes (antes estaba en ~24)
                strokeWidth={2}
              />
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
