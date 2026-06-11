// src/components/Header.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { app } from "@/lib/firebase";
import { useTranslation } from "@/lib/i18n";

type Props = {
  onOpenLead?: () => void;
  isLoggedIn?: boolean;
  onLogout?: () => Promise<void> | void;
};

export default function Header({ onOpenLead: _onOpenLead, isLoggedIn, onLogout }: Props) {
  const router = useRouter();
  const [logged, setLogged] = useState<boolean>(!!isLoggedIn);
  const t = useTranslation();

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
      alert(t.auth.logoutError);
    }
  }

  return (
    <header style={{ background: "#09080f" }} className="sticky top-0 z-50">
      <div className="mx-auto grid h-24 max-w-xl grid-cols-3 items-center gap-2 px-4">
        {/* Izquierda: Soy restaurante */}
        {/* HIDDEN — restaurar cuando se reactive el portal de restaurantes
        <div className="justify-self-start">
          <button onClick={() => onOpenLead?.()} className="btn-ghost-cronos" style={{ fontSize: "0.75rem", padding: "6px 12px", whiteSpace: "nowrap" }}>
            {t.header.restaurant}
          </button>
        </div>
        */}
        <div className="justify-self-start" />

        {/* Centro: logo */}
        <div className="justify-self-center">
          <Link href="/home" className="select-none">
            <img
              src="/logo-cronos.png"
              alt="Cronos Sports"
              style={{ height: "80px", width: "auto", objectFit: "contain" }}
            />
          </Link>
        </div>

        {/* Derecha: login/logout */}
        <div className="justify-self-end">
          {logged ? (
            <button onClick={handleLogout} className="btn-ghost-cronos" style={{ fontSize: "0.75rem", padding: "6px 12px", whiteSpace: "nowrap" }}>
              {t.header.logout}
            </button>
          ) : (
            <Link href="/auth/login" className="btn-ghost-cronos" style={{ fontSize: "0.75rem", padding: "6px 12px", whiteSpace: "nowrap" }}>
              {t.header.login}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
