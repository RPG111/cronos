// src/lib/bracket-utils.ts — Pure client-side helpers for bracket computation
import type { BracketMatch, BracketRound } from "./firestore/bracket";

export const ROUND_ORDER: BracketRound[] = ["r32", "r16", "qf", "sf", "third", "final"];

// Build reverse feed map: for each match, which source matches feed into it and via which slot
function buildReverseFeeds(matches: BracketMatch[]): Record<string, { A?: string; B?: string }> {
  const map: Record<string, { A?: string; B?: string }> = {};
  for (const m of matches) {
    if (m.feedsInto) {
      if (!map[m.feedsInto.matchId]) map[m.feedsInto.matchId] = {};
      map[m.feedsInto.matchId][m.feedsInto.slot] = m.id;
    }
  }
  return map;
}

// Returns the two teams that appear in a match given current picks.
// For r32: use stored teamA/teamB (set by admin when teams are known).
// For "third": loser of sf-1 (slot A) and loser of sf-2 (slot B) — feedsInto does NOT cover this.
// For all other rounds: winner of whichever match feeds into slot A/B.
export function getEffectiveTeams(
  matches: BracketMatch[],
  picks: Record<string, string>,
  matchId: string
): { teamA: string | null; teamB: string | null } {
  const match = matches.find((m) => m.id === matchId);
  if (!match) return { teamA: null, teamB: null };

  if (match.round === "r32") {
    return { teamA: match.teamA, teamB: match.teamB };
  }

  if (matchId === "third") {
    const sf1 = getEffectiveTeams(matches, picks, "sf-1");
    const sf2 = getEffectiveTeams(matches, picks, "sf-2");
    const sf1Winner = picks["sf-1"] ?? null;
    const sf2Winner = picks["sf-2"] ?? null;
    const teamA = sf1Winner
      ? sf1.teamA === sf1Winner ? sf1.teamB : sf1.teamA
      : null;
    const teamB = sf2Winner
      ? sf2.teamA === sf2Winner ? sf2.teamB : sf2.teamA
      : null;
    return { teamA, teamB };
  }

  const rev = buildReverseFeeds(matches);
  const feeders = rev[matchId] ?? {};
  return {
    teamA: feeders.A ? (picks[feeders.A] ?? null) : null,
    teamB: feeders.B ? (picks[feeders.B] ?? null) : null,
  };
}

// BFS from changedMatchId to find all transitively downstream matches
function getDownstreamMatchIds(fromMatchId: string, matches: BracketMatch[]): string[] {
  const result: string[] = [];
  const queue = [fromMatchId];
  const visited = new Set<string>();

  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const m = matches.find((m) => m.id === id);
    if (!m) continue;

    if (m.feedsInto) {
      result.push(m.feedsInto.matchId);
      queue.push(m.feedsInto.matchId);
    }

    // sf losers go to "third" — not in feedsInto, handled specially
    if ((id === "sf-1" || id === "sf-2") && !visited.has("third")) {
      result.push("third");
      queue.push("third");
    }
  }

  return result;
}

// After changing picks[changedMatchId], clear any downstream picks that are no longer valid.
// Processes in BFS order so each level sees the already-corrected state of prior levels.
export function cascadeInvalidate(
  changedMatchId: string,
  matches: BracketMatch[],
  picks: Record<string, string>
): Record<string, string> {
  const newPicks = { ...picks };
  const downstream = getDownstreamMatchIds(changedMatchId, matches);

  for (const matchId of downstream) {
    const { teamA, teamB } = getEffectiveTeams(matches, newPicks, matchId);
    const current = newPicks[matchId];
    if (current && current !== teamA && current !== teamB) {
      delete newPicks[matchId];
    }
  }

  return newPicks;
}

export function getMatchesForRound(matches: BracketMatch[], round: BracketRound): BracketMatch[] {
  return matches
    .filter((m) => m.round === round)
    .sort((a, b) => a.matchNumber - b.matchNumber);
}

export function countPicksForRound(
  matches: BracketMatch[],
  picks: Record<string, string>,
  round: BracketRound
): { picked: number; total: number } {
  const roundMatches = getMatchesForRound(matches, round);
  return { picked: roundMatches.filter((m) => picks[m.id]).length, total: roundMatches.length };
}

export function isRoundComplete(
  matches: BracketMatch[],
  picks: Record<string, string>,
  round: BracketRound
): boolean {
  const { picked, total } = countPicksForRound(matches, picks, round);
  return total > 0 && picked === total;
}

export function areAllPicksComplete(
  matches: BracketMatch[],
  picks: Record<string, string>
): boolean {
  return ROUND_ORDER.every((r) => isRoundComplete(matches, picks, r));
}

export function getRoundLabel(round: BracketRound, t: { bracket: Record<string, string> }): string {
  const map: Record<BracketRound, string> = {
    r32: t.bracket.roundR32,
    r16: t.bracket.roundR16,
    qf: t.bracket.roundQF,
    sf: t.bracket.roundSF,
    third: t.bracket.roundThird,
    final: t.bracket.roundFinal,
  };
  return map[round];
}
