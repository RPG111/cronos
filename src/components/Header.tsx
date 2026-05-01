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

  return (
    <header style={{ background: "#080c14", borderBottom: "1px solid #142035" }} className="sticky top-0 z-50">
      <div className="mx-auto grid h-14 max-w-xl grid-cols-3 items-center gap-2 px-4">
        {/* Izquierda: Soy restaurante */}
        <div className="justify-self-start">
          <button onClick={() => onOpenLead?.()} className="btn-ghost-cronos">
            Soy restaurante
          </button>
        </div>

        {/* Centro: logo */}
        <div className="justify-self-center">
          <Link href="/home" className="select-none" style={{ textDecoration: "none" }}>
            <span style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontWeight: 900,
              fontSize: "1.35rem",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              background: "linear-gradient(180deg, #ffffff 0%, #a8c0d6 25%, #c8d8e8 45%, #6888aa 60%, #9ab0c8 75%, #d0e0f0 88%, #7890a8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 6px rgba(160,200,255,0.5)) drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
              display: "inline-block",
              lineHeight: 1,
            }}>
              CRONOS
            </span>
            <span style={{
              display: "block",
              textAlign: "center",
              fontFamily: "'Arial', sans-serif",
              fontWeight: 400,
              fontSize: "0.55rem",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              background: "linear-gradient(180deg, #b0c8e0 0%, #7090b0 50%, #90aac8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginTop: "-2px",
            }}>
              SPORTS
            </span>
          </Link>
        </div>

        {/* Derecha: login/logout */}
        <div className="justify-self-end">
          {logged ? (
            <button onClick={handleLogout} className="btn-ghost-cronos">
              Cerrar sesión
            </button>
          ) : (
            <Link href="/auth/login" className="btn-ghost-cronos">
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
