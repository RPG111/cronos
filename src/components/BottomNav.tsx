// src/components/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Map } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const links = [
    { href: "/map", label: "Mapa", icon: Map },
    { href: "/home", label: "Home", icon: Home },
    { href: "/profile", label: "Perfil", icon: User },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2" style={{ width: "90%", maxWidth: "400px" }}>
      <div
        className="flex justify-around backdrop-blur-md shadow-lg"
        style={{
          background: "#060a10",
          borderTop: "1px solid #0d1528",
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
              style={{ color: active ? "#00ff9d" : "#3a5070" }}
            >
              <Icon size={18} strokeWidth={2} />
              <span className="text-[11px] font-medium">{label}</span>
              {active && (
                <span
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "#00ff9d",
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
