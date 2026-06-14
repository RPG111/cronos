"use client";

import { Lock } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { BracketMatch, BracketPick } from "@/lib/firestore/bracket";
import {
  ROUND_ORDER,
  getMatchesForRound,
  getEffectiveTeams,
  getRoundLabel,
} from "@/lib/bracket-utils";

interface Props {
  matches: BracketMatch[];
  pick: BracketPick | null;
  isFinished?: boolean;
}

export default function BracketReadOnly({ matches, pick, isFinished = false }: Props) {
  const t = useTranslation();
  const b = t.bracket;
  const picks = pick?.picks ?? {};

  return (
    <div className="flex flex-col gap-5 px-4 pt-6 pb-28">
      {/* Banner bloqueado */}
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ background: "rgba(240,192,64,0.08)", border: "1px solid rgba(240,192,64,0.25)" }}
      >
        <Lock size={18} style={{ color: "#f0c040", flexShrink: 0 }} />
        <span className="text-sm font-medium" style={{ color: "#f0c040" }}>
          {b.locked}
        </span>
      </div>

      {!pick ? (
        <p className="text-center text-sm py-8" style={{ color: "#6a5a35" }}>
          {b.noPick}
        </p>
      ) : (
        ROUND_ORDER.map((round) => {
          const roundMatches = getMatchesForRound(matches, round);
          if (!roundMatches.length) return null;

          return (
            <div key={round} className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#a0905a" }}>
                {getRoundLabel(round, t)}
              </h3>
              <div className="flex flex-col gap-2">
                {roundMatches.map((match) => {
                  const { teamA, teamB } = getEffectiveTeams(matches, picks, match.id);
                  const picked = picks[match.id] ?? null;

                  return (
                    <div
                      key={match.id}
                      className="rounded-xl px-4 py-3 flex flex-col gap-1"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <div className="flex items-center gap-2 text-sm" style={{ color: "#c0aa78" }}>
                        <span>{teamA ?? b.tbd}</span>
                        <span style={{ color: "#4a3a1a" }}>vs</span>
                        <span>{teamB ?? b.tbd}</span>
                      </div>
                      {picked ? (
                        <div className="text-xs font-semibold" style={{ color: "#f0c040" }}>
                          {b.yourPick} {picked}
                        </div>
                      ) : (
                        <div className="text-xs" style={{ color: "#4a3a1a" }}>
                          {b.noPick}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Marcador final predicho */}
      {pick?.finalScorePrediction && (
        <div
          className="rounded-2xl px-4 py-4 flex flex-col gap-1"
          style={{ background: "rgba(240,192,64,0.08)", border: "1px solid rgba(240,192,64,0.2)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#a0905a" }}>
            {b.scoreLabel}
          </p>
          <p className="text-lg font-bold" style={{ color: "#f0c040" }}>
            {pick.finalScorePrediction.scoreA} – {pick.finalScorePrediction.scoreB}
          </p>
        </div>
      )}
    </div>
  );
}
