// src/components/TeamsAutocomplete.tsx
"use client";

import { useMemo } from "react";

export type TeamOption = { id: string; name: string; country?: string; league?: string };

const POPULAR_TEAMS: TeamOption[] = [
  // 🌎 Selecciones
  { id: "mex", name: "México", country: "México" },
  { id: "usa", name: "Estados Unidos", country: "USA" },
  { id: "jpn", name: "Japón", country: "Japón" },
  { id: "arg", name: "Argentina", country: "Argentina" },
  { id: "bra", name: "Brasil", country: "Brasil" },
  { id: "esp", name: "España", country: "España" },
  // 🇪🇸 LaLiga
  { id: "rm", name: "Real Madrid", league: "LaLiga" },
  { id: "fcb", name: "FC Barcelona", league: "LaLiga" },
  { id: "atm", name: "Atlético de Madrid", league: "LaLiga" },
  { id: "sev", name: "Sevilla", league: "LaLiga" },
  // 🏴 EPL
  { id: "mu", name: "Manchester United", league: "Premier League" },
  { id: "mc", name: "Manchester City", league: "Premier League" },
  { id: "liv", name: "Liverpool", league: "Premier League" },
  { id: "ars", name: "Arsenal", league: "Premier League" },
  { id: "che", name: "Chelsea", league: "Premier League" },
  { id: "tot", name: "Tottenham", league: "Premier League" },
  // 🇮🇹 Serie A
  { id: "juv", name: "Juventus", league: "Serie A" },
  { id: "mil", name: "AC Milan", league: "Serie A" },
  { id: "int", name: "Inter", league: "Serie A" },
  { id: "nap", name: "Napoli", league: "Serie A" },
  // 🇩🇪 Bundesliga
  { id: "fcb_b", name: "Bayern München", league: "Bundesliga" },
  { id: "bvb", name: "Borussia Dortmund", league: "Bundesliga" },
  { id: "rb", name: "RB Leipzig", league: "Bundesliga" },
  // 🇲🇽 Liga MX
  { id: "ame", name: "América", league: "Liga MX" },
  { id: "tig", name: "Tigres", league: "Liga MX" },
  { id: "mon", name: "Monterrey", league: "Liga MX" },
  { id: "gua", name: "Guadalajara (Chivas)", league: "Liga MX" },
  { id: "pum", name: "Pumas", league: "Liga MX" },
  { id: "tol", name: "Toluca", league: "Liga MX" },
  { id: "leon", name: "León", league: "Liga MX" },
  { id: "san", name: "Santos Laguna", league: "Liga MX" },
  // 🇺🇸 MLS
  { id: "mia", name: "Inter Miami", league: "MLS" },
  { id: "lafc", name: "LAFC", league: "MLS" },
  { id: "lag", name: "LA Galaxy", league: "MLS" },
  { id: "atl", name: "Atlanta United", league: "MLS" },
  // 🇸🇻/🌎 ejemplos
  { id: "cd_fas", name: "CD FAS", country: "El Salvador", league: "Primera División" },
  { id: "alaj", name: "LD Alajuelense", country: "Costa Rica", league: "Primera" },
  { id: "sap", name: "Deportivo Saprissa", country: "Costa Rica", league: "Primera" },
];

export default function TeamsAutocomplete({
  value,
  onChange,
  placeholder = "Busca o escribe tu equipo (ej. Real Madrid, América...)",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const query = (value || "").trim();
  const options = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return POPULAR_TEAMS.slice(0, 12);
    return POPULAR_TEAMS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.country?.toLowerCase().includes(q) ?? false) ||
        (t.league?.toLowerCase().includes(q) ?? false)
    ).slice(0, 20);
  }, [query]);

  const exactMatch = options.some((o) => o.name.toLowerCase() === query.toLowerCase());

  return (
    <div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 text-white outline-none focus:border-emerald-500"
      />

      <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-white/10 bg-zinc-900/60">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.name)}
            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-white hover:bg-zinc-800"
          >
            <span>{opt.name}</span>
            <span className="text-[10px] text-zinc-400">
              {(opt.league || opt.country) ?? ""}
            </span>
          </button>
        ))}

        {options.length === 0 && (
          <div className="px-3 py-2 text-sm text-zinc-400">
            No hay resultados. Puedes usar el texto tal cual.
          </div>
        )}
      </div>

      {/* Si escribió algo que no es match exacto, mostramos "usar texto tal cual" */}
      {query && !exactMatch && (
        <button
          type="button"
          onClick={() => onChange(query)}
          className="mt-2 w-full rounded-lg border border-white/10 bg-zinc-800/70 px-3 py-2 text-sm text-white hover:bg-zinc-700"
        >
          Usar “{query}”
        </button>
      )}

      <div className="mt-2 text-xs text-zinc-400">
        * Si no aparece tu equipo, escribe su nombre y continúa.
      </div>
    </div>
  );
}
