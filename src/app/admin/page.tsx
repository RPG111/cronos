"use client";

import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

/**
 * Admin simple: solo muestra acceso si currentUser.uid está en NEXT_PUBLIC_ADMIN_UIDS.
 * Asegúrate de tener NEXT_PUBLIC_ADMIN_UIDS en .env.local (coma-separado).
 * Ej: NEXT_PUBLIC_ADMIN_UIDS=uid1,uid2
 */
export default function AdminPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const admins = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_ADMIN_UIDS || "";
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, []);

  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
      setLoading(false);
    });
    return () => off();
  }, []);

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center text-white">
        Cargando…
      </main>
    );
  }

  if (!uid) {
    return (
      <main className="grid min-h-dvh place-items-center text-white">
        <div className="rounded-xl border border-white/10 bg-black/60 px-6 py-4 text-center">
          Debes iniciar sesión para entrar a Admin.{" "}
          <Link className="underline" href="/auth/login">Ir a iniciar sesión</Link>
        </div>
      </main>
    );
  }

  const hasAccess = admins.includes(uid);

  if (!hasAccess) {
    return (
      <main className="grid min-h-dvh place-items-center text-white">
        <div className="rounded-xl border border-white/10 bg-black/60 px-6 py-4 text-center">
          No tienes acceso a esta página. UID actual: <code>{uid}</code>
          <div className="mt-2 text-sm text-white/70">
            (Si eres admin, agrega tu UID a NEXT_PUBLIC_ADMIN_UIDS y reinicia el servidor)
          </div>
        </div>
      </main>
    );
  }

  // --- Contenido simple; aquí puedes poner tus listas de asistentes/quinielas ---
  return (
    <main className="relative min-h-dvh w-full">
      <img src="/images/stadium.jpg" alt="" className="absolute inset-0 h-full w-full object-cover blur-sm" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

      <div className="relative z-10 mx-auto max-w-xl px-4 py-8 text-white">
        <h1 className="text-3xl font-bold">Panel Admin</h1>
        <p className="mt-1 text-white/80">UID: <code>{uid}</code></p>

        <div className="mt-6 grid gap-4">
          <Link href="/home" className="underline text-emerald-300">Volver al Home</Link>
          {/* Aquí puedes renderizar los componentes de asistentes y quinielas que ya tengas */}
          <div className="rounded-xl border border-white/10 bg-black/50 p-4">
            <div className="text-white/80">Aquí va tu tabla de Asistentes…</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/50 p-4">
            <div className="text-white/80">Aquí va tu tabla de Quinielas…</div>
          </div>
        </div>
      </div>
    </main>
  );
}
