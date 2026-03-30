// src/components/Header.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { app } from "@/lib/firebase";

type Props = {
  onOpenLead?: () => void;      // abre modal “Soy restaurante”
  isLoggedIn?: boolean;         // si ya pasas este prop desde la página, se usa
  onLogout?: () => Promise<void> | void;
};

export default function Header({ onOpenLead, isLoggedIn, onLogout }: Props) {
  const router = useRouter();
  const [logged, setLogged] = useState<boolean>(!!isLoggedIn);

  useEffect(() => {
    if (typeof isLoggedIn === "boolean") { setLogged(isLoggedIn); return; }
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (u) => setLogged(!!u));
    return () => unsub();
  }, [isLoggedIn]);

  async function handleLogout() {
    try {
      if (onLogout) await onLogout();
      else await signOut(getAuth(app));
      router.push("/auth/login");
    } catch (e) {
      console.error(e);
      alert("No se pudo cerrar sesión.");
    }
  }

  return (
    <header
      className="
        sticky top-0 z-50
        border-b border-white/10
        bg-black/70 backdrop-blur
        supports-[backdrop-filter]:bg-black/50
      "
    >
      {/* alto fijo: 56px; así no se “sube” el contenido debajo */}
      <div className="mx-auto h-14 max-w-xl px-4 grid grid-cols-3 items-center gap-2">
        {/* Izquierda: Soy restaurante */}
        <div className="justify-self-start">
          <button
            onClick={() => onOpenLead?.()}
            className="rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
          >
            Soy restaurante
          </button>
        </div>

        {/* Centro: logo/título */}
        <div className="justify-self-center">
          <Link href="/home" className="select-none text-lg font-extrabold tracking-tight text-white">
            Cronos
          </Link>
        </div>

        {/* Derecha: login/logout */}
        <div className="justify-self-end">
          {logged ? (
            <button
              onClick={handleLogout}
              className="rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
            >
              Cerrar sesión
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
