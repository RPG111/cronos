"use client";
import { QRCodeSVG } from "qrcode.react";

export type QRData = {
  code: string;
  eventTitle: string;
  userName?: string;
  team?: string;
};

export default function QRModal({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: QRData | null;
}) {
  if (!open || !data) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-[92%] max-w-sm rounded-2xl border border-white/10 bg-zinc-900/95 p-6 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold leading-tight">{data.eventTitle}</h3>
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-2 py-1 text-sm hover:bg-zinc-700"
          >
            ✕
          </button>
        </div>

        <div className="flex justify-center rounded-xl bg-white p-4">
          <QRCodeSVG value={data.code} size={200} />
        </div>

        <div className="mt-4 space-y-1 text-center">
          {data.userName && (
            <p className="text-sm text-zinc-300">{data.userName}</p>
          )}
          {data.team && (
            <p className="text-sm font-semibold text-emerald-300">{data.team}</p>
          )}
          <p className="mt-2 font-mono text-lg font-bold tracking-widest text-white">
            {data.code}
          </p>
          <p className="text-xs text-zinc-500">Muestra este código en la entrada</p>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-zinc-800 py-3 font-semibold text-white hover:bg-zinc-700 transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
