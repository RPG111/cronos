"use client";

import Link from "next/link";

export default function Header({
  onOpenLead,
  isLoggedIn,
  onLogout,
}: {
  onOpenLead: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}) {
  return (
    <header className="flex items-center justify-between px-5 py-4 border-b border-white/10">
      <button
        onClick={onOpenLead}
        className="rounded-lg bg-zinc-800/70 px-3 py-2 text-sm text-white hover:bg-zinc-700 transition"
      >
        Soy restaurante
      </button>

      <h1 className="text-lg font-bold text-white">Cronos</h1>

      {isLoggedIn ? (
        <button
          onClick={onLogout}
          className="rounded-lg border border-white/15 bg-zinc-800 px-3 py-2 text-sm text-white hover:bg-zinc-700 transition"
        >
          Cerrar sesión
        </button>
      ) : (
        <Link
          href="/auth/login"
          className="rounded-lg border border-white/15 bg-zinc-800 px-3 py-2 text-sm text-white hover:bg-zinc-700 transition"
        >
          Iniciar sesión / Registrarse
        </Link>
      )}
    </header>
  );
}
