// src/components/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Map, Trophy } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function BottomNav() {
  const pathname = usePathname();
  const t = useTranslation();

  const links = [
    { href: "/map", label: t.nav.map, icon: Map },
    { href: "/home", label: t.nav.home, icon: Home },
    { href: "/bracket", label: t.nav.bracket, icon: Trophy },
    { href: "/profile", label: t.nav.profile, icon: User },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2" style={{ width: "90%", maxWidth: "400px" }}>
      <div
        className="flex justify-around backdrop-blur-md shadow-lg"
        style={{
          background: "#060a10",
          borderTop: "1px solid #2a2010",
          borderRadius: "20px",
        }}
      >
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition"
              style={{ color: active ? "#f0c040" : "#8a7a50" }}
            >
              <Icon size={18} strokeWidth={2} />
              <span className="text-[11px] font-medium">{label}</span>
              {active && (
                <span
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "#f0c040",
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
