"use client";

import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

/**
 * Botón que:
 * - Si NO hay sesión: redirige a /auth/login?next=/events/{eventId}
 * - Si hay sesión: llama onReserve() (tu flujo actual de reserva)
 */
export default function AuthReserveButton({
  eventId,
  onReserve,
  className = "",
}: {
  eventId: string;
  onReserve: () => void; // pásanos tu handler que abre el pop-up existente
  className?: string;
}) {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => off();
  }, []);

  const handleClick = () => {
    if (!uid) {
      // No autenticado → lo mandamos a login y luego vuelve al evento.
      router.push(`/auth/login?next=/events/${eventId}`);
      return;
    }
    // Autenticado → seguimos con el flujo actual de reserva.
    onReserve();
  };

  return (
    <button
      onClick={handleClick}
      className={
        className ||
        "w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white hover:bg-emerald-600"
      }
    >
      Reservar
    </button>
  );
}
