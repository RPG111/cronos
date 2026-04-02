// src/components/Header.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { app } from "@/lib/firebase";

type Props = {
  onOpenLead?: () => void;
  isLoggedIn?: boolean;
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

  const pillStyle: React.CSSProperties = {
    background: "#0d1528",
    border: "1px solid #1e3050",
    color: "#c8d8f0",
    fontSize: "11px",
    fontWeight: 600,
    padding: "6px 12px",
    borderRadius: "20px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  return (
    <header style={{ background: "#080c14", borderBottom: "1px solid #142035" }} className="sticky top-0 z-50">
      <div className="mx-auto grid h-14 max-w-xl grid-cols-3 items-center gap-2 px-4">
        {/* Izquierda: Soy restaurante */}
        <div className="justify-self-start">
          <button onClick={() => onOpenLead?.()} style={pillStyle}>
            Soy restaurante
          </button>
        </div>

        {/* Centro: logo */}
        <div className="justify-self-center">
          <Link href="/home" className="logo-cronos select-none">
            CRONOS
          </Link>
        </div>

        {/* Derecha: login/logout */}
        <div className="justify-self-end">
          {logged ? (
            <button onClick={handleLogout} style={pillStyle}>
              Cerrar sesión
            </button>
          ) : (
            <Link href="/auth/login" style={pillStyle}>
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
