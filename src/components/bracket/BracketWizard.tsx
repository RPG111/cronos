"use client";

import { useState, useCallback } from "react";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { saveUserPick } from "@/lib/firestore/bracket";
import type { BracketMatch, BracketPick } from "@/lib/firestore/bracket";
import {
  ROUND_ORDER,
  getMatchesForRound,
  getEffectiveTeams,
  cascadeInvalidate,
  countPicksForRound,
  isRoundComplete,
  areAllPicksComplete,
  getRoundLabel,
} from "@/lib/bracket-utils";
import type { BracketRound } from "@/lib/firestore/bracket";

interface Props {
  matches: BracketMatch[];
  initialPick: BracketPick | null;
  userId: string;
  userName: string;
}

// ── MatchPickCard ─────────────────────────────────────────────────────────────

interface CardProps {
  matchId: string;
  matchNumber: number;
  teamA: string | null;
  teamB: string | null;
  picked: string | null;
  onPick: (matchId: string, team: string) => void;
  t: ReturnType<typeof useTranslation>;
}

function MatchPickCard({ matchId, matchNumber, teamA, teamB, picked, onPick, t }: CardProps) {
  const b = t.bracket;

  function TeamBtn({ team }: { team: string | null }) {
    if (!team) {
      return (
        <div
          className="w-full py-4 px-4 rounded-xl text-sm"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#4a3a1a" }}
        >
          {b.tbd}
        </div>
      );
    }
    const isPicked = picked === team;
    const isOther = picked !== null && !isPicked;

    return (
      <button
        onClick={() => onPick(matchId, team)}
        className="w-full py-4 px-4 rounded-xl text-left text-sm font-semibold transition-all active:scale-[0.98]"
        style={
          isPicked
            ? { background: "rgba(240,192,64,0.18)", border: "2px solid #f0c040", color: "#f0c040" }
            : isOther
            ? { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.28)" }
            : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.13)", color: "#e0d0a0" }
        }
      >
        <span className="flex items-center gap-2">
          {isPicked && <CheckCircle2 size={14} style={{ color: "#f0c040", flexShrink: 0 }} />}
          {team}
        </span>
      </button>
    );
  }

  return (
    <div
      className="flex flex-col gap-2 p-4 rounded-2xl"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
    >
      <p className="text-xs" style={{ color: "#5a4a25" }}>
        {b.matchLabel} {matchNumber}
      </p>
      <TeamBtn team={teamA} />
      <div className="text-center text-xs" style={{ color: "#4a3a1a" }}>
        {b.vs}
      </div>
      <TeamBtn team={teamB} />
    </div>
  );
}

// ── RoundHeader ───────────────────────────────────────────────────────────────

function RoundHeader({
  label,
  picked,
  total,
  complete,
  t,
}: {
  label: string;
  picked: number;
  total: number;
  complete: boolean;
  t: ReturnType<typeof useTranslation>;
}) {
  const b = t.bracket;
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="text-base font-bold text-white">{label}</h2>
      {complete ? (
        <span className="text-xs font-semibold" style={{ color: "#f0c040" }}>
          {b.roundComplete}
        </span>
      ) : (
        <span className="text-xs" style={{ color: "#8a7a50" }}>
          {picked}/{total} {b.progressLabel}
        </span>
      )}
    </div>
  );
}

// ── FinalScoreInputs ──────────────────────────────────────────────────────────

function FinalScoreInputs({
  teamA,
  teamB,
  scoreA,
  scoreB,
  onChange,
  t,
}: {
  teamA: string | null;
  teamB: string | null;
  scoreA: number;
  scoreB: number;
  onChange: (a: number, b: number) => void;
  t: ReturnType<typeof useTranslation>;
}) {
  const b = t.bracket;
  return (
    <div
      className="flex flex-col gap-4 rounded-2xl p-5"
      style={{ background: "rgba(240,192,64,0.07)", border: "1px solid rgba(240,192,64,0.2)" }}
    >
      <p className="text-sm font-semibold text-white">{b.finalScoreTitle}</p>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xs text-center truncate w-full text-center" style={{ color: "#c0aa78" }}>
            {teamA ?? b.tbd}
          </span>
          <input
            type="number"
            min={0}
            max={20}
            value={scoreA}
            onChange={(e) => onChange(Math.max(0, Number(e.target.value)), scoreB)}
            className="w-full text-center rounded-xl text-xl font-bold py-3 outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#f0c040" }}
          />
        </div>
        <span className="text-lg font-bold" style={{ color: "#4a3a1a" }}>–</span>
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xs text-center truncate w-full text-center" style={{ color: "#c0aa78" }}>
            {teamB ?? b.tbd}
          </span>
          <input
            type="number"
            min={0}
            max={20}
            value={scoreB}
            onChange={(e) => onChange(scoreA, Math.max(0, Number(e.target.value)))}
            className="w-full text-center rounded-xl text-xl font-bold py-3 outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#f0c040" }}
          />
        </div>
      </div>
    </div>
  );
}

// ── BracketWizard (main) ──────────────────────────────────────────────────────

export default function BracketWizard({ matches, initialPick, userId, userName }: Props) {
  const t = useTranslation();
  const b = t.bracket;

  const [picks, setPicks] = useState<Record<string, string>>(initialPick?.picks ?? {});
  const [finalScore, setFinalScore] = useState<{ scoreA: number; scoreB: number }>(
    initialPick?.finalScorePrediction ?? { scoreA: 0, scoreB: 0 }
  );
  const [roundIdx, setRoundIdx] = useState<number>(() => {
    // Start at the first incomplete round (or last if all done)
    for (let i = 0; i < ROUND_ORDER.length; i++) {
      if (!isRoundComplete(matches, initialPick?.picks ?? {}, ROUND_ORDER[i])) return i;
    }
    return ROUND_ORDER.length - 1;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentRound = ROUND_ORDER[roundIdx];
  const roundMatches = getMatchesForRound(matches, currentRound);
  const { picked, total } = countPicksForRound(matches, picks, currentRound);
  const roundDone = picked === total && total > 0;
  const allDone = areAllPicksComplete(matches, picks);
  const isLastRound = roundIdx === ROUND_ORDER.length - 1;

  const handlePick = useCallback(
    (matchId: string, team: string) => {
      setSaved(false);
      setError(null);
      setPicks((prev) => {
        const updated = { ...prev, [matchId]: team };
        return cascadeInvalidate(matchId, matches, updated);
      });
    },
    [matches]
  );

  const handleSave = async () => {
    if (!allDone) {
      setError(b.incompleteWarning);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveUserPick({
        userId,
        userName,
        picks,
        finalScorePrediction: finalScore,
      });
      setSaved(true);
    } catch (e: unknown) {
      setError(b.saveError);
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Round nav dots
  const RoundDots = () => (
    <div className="flex items-center justify-center gap-1.5 pt-1">
      {ROUND_ORDER.map((r, i) => {
        const done = isRoundComplete(matches, picks, r);
        const active = i === roundIdx;
        return (
          <button
            key={r}
            onClick={() => { setRoundIdx(i); setSaved(false); }}
            className="rounded-full transition-all"
            style={{
              width: active ? 20 : 8,
              height: 8,
              background: done ? "#f0c040" : active ? "#f0c04088" : "rgba(255,255,255,0.15)",
            }}
            aria-label={getRoundLabel(r, t)}
          />
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-32">
      {/* Round dots navigation */}
      <RoundDots />

      {/* Round header */}
      <RoundHeader
        label={getRoundLabel(currentRound, t)}
        picked={picked}
        total={total}
        complete={roundDone}
        t={t}
      />

      {/* Match cards */}
      <div className="flex flex-col gap-3">
        {roundMatches.map((match) => {
          const { teamA, teamB } = getEffectiveTeams(matches, picks, match.id);
          return (
            <MatchPickCard
              key={match.id}
              matchId={match.id}
              matchNumber={match.matchNumber}
              teamA={teamA}
              teamB={teamB}
              picked={picks[match.id] ?? null}
              onPick={handlePick}
              t={t}
            />
          );
        })}
      </div>

      {/* Final score inputs — only on final round */}
      {currentRound === "final" && (() => {
        const { teamA, teamB } = getEffectiveTeams(matches, picks, "final");
        return (
          <FinalScoreInputs
            teamA={teamA}
            teamB={teamB}
            scoreA={finalScore.scoreA}
            scoreB={finalScore.scoreB}
            onChange={(a, b_) => { setFinalScore({ scoreA: a, scoreB: b_ }); setSaved(false); }}
            t={t}
          />
        );
      })()}

      {/* Save feedback */}
      {saved && (
        <div
          className="rounded-xl px-4 py-3 text-sm text-center font-medium"
          style={{ background: "rgba(240,192,64,0.12)", border: "1px solid rgba(240,192,64,0.3)", color: "#f0c040" }}
        >
          {b.saved}
        </div>
      )}
      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm text-center"
          style={{ background: "rgba(220,50,50,0.1)", border: "1px solid rgba(220,50,50,0.3)", color: "#f07070" }}
        >
          {error}
        </div>
      )}

      {/* Nav buttons */}
      <div className="flex gap-3">
        {roundIdx > 0 && (
          <button
            onClick={() => { setRoundIdx((i) => i - 1); setSaved(false); setError(null); }}
            className="flex-1 py-3.5 rounded-2xl text-sm font-medium transition-opacity"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#c0aa78" }}
          >
            {b.prevRound}
          </button>
        )}

        {!isLastRound ? (
          <button
            disabled={!roundDone}
            onClick={() => setRoundIdx((i) => i + 1)}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-opacity"
            style={{
              background: roundDone ? "#f0c040" : "rgba(240,192,64,0.15)",
              color: roundDone ? "#060a10" : "#5a4a20",
              opacity: roundDone ? 1 : 0.7,
            }}
          >
            {b.nextRound}
          </button>
        ) : (
          <button
            disabled={saving || !allDone}
            onClick={handleSave}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-opacity"
            style={{
              background: allDone ? "#f0c040" : "rgba(240,192,64,0.15)",
              color: allDone ? "#060a10" : "#5a4a20",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? b.saving : b.saveBracket}
          </button>
        )}
      </div>
    </div>
  );
}
