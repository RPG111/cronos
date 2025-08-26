// src/components/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, CircleDollarSign } from "lucide-react";

export default function BottomNav() {
  const path = usePathname();
  const isActive = (p: string) => path === p || path?.startsWith(p);

  function Item(props: {
    href: string;
    label: string;
    active: boolean;
    Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  }) {
    const { href, label, active, Icon } = props;
    return (
      <Link
        href={href}
        className={[
          "flex w-full flex-col items-center justify-center rounded-[20px] px-5 py-4 transition",
          active
            ? "bg-emerald-800/50 ring-2 ring-emerald-500/50 text-emerald-200"
            : "text-white"
        ].join(" ")}
      >
        <Icon
          size={24}
          strokeWidth={2.25}
          className={active ? "text-emerald-200" : "text-white/90"}
        />
        <span className="mt-1 text-[15px] font-medium">{label}</span>
      </Link>
    );
  }

  return (
    <>
      {/* separador para que el contenido no quede debajo del nav */}
      <div className="h-28" />

      {/* tarjeta/pastilla centrada con vidrio */}
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
          <Item href="/picks" label="Quinielas" active={isActive("/picks")} Icon={CircleDollarSign} />
          <Item href="/home" label="Home" active={isActive("/home") || path === "/"} Icon={Home} />
          <Item href="/profile" label="Perfil" active={isActive("/profile")} Icon={User} />
        </div>
      </nav>

      {/* safe area iPhone */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </>
  );
}
