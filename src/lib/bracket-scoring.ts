// src/lib/bracket-scoring.ts — Pure scoring logic, no Firestore calls
import type { BracketMatch, BracketPick, BracketRound } from "./firestore/bracket";
import { ROUND_POINTS } from "./firestore/bracket";

export interface ScoreResult {
  total: number;
  breakdown: Record<BracketRound, number>;
}

export function calculateUserScore(pick: BracketPick, matches: BracketMatch[]): ScoreResult {
  const breakdown: Record<BracketRound, number> = {
    r32: 0, r16: 0, qf: 0, sf: 0, third: 0, final: 0,
  };
  for (const match of matches) {
    if (!match.winner) continue;
    const userPick = pick.picks[match.id];
    if (!userPick) continue;
    if (userPick === match.winner) {
      breakdown[match.round] += ROUND_POINTS[match.round];
    }
  }
  return { total: Object.values(breakdown).reduce((s, v) => s + v, 0), breakdown };
}

// Lower delta = better tiebreaker. Returns Infinity if final not played yet.
export function tiebreakerDelta(pick: BracketPick, finalMatch: BracketMatch | undefined): number {
  if (!finalMatch || finalMatch.scoreA == null || finalMatch.scoreB == null) return Infinity;
  const p = pick.finalScorePrediction;
  return Math.abs(p.scoreA - (finalMatch.scoreA ?? 0)) + Math.abs(p.scoreB - (finalMatch.scoreB ?? 0));
}
