// src/components/TeamSelect.tsx
"use client";

export default function TeamSelect(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const { value, onChange, placeholder = "Ej. Real Madrid", label = "Equipo" } = props;

  return (
    <div className="grid gap-1">
      <label className="text-xs text-white/70">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-emerald-500"
      />
      <p className="mt-1 text-[11px] text-white/50">
        Escribe el nombre del equipo (texto libre). Más adelante agregamos la lista completa.
      </p>
    </div>
  );
}
