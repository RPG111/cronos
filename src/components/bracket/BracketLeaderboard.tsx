"use client";

import { useMemo } from "react";
import { useTranslation } from "@/lib/i18n";
import { calculateUserScore, tiebreakerDelta } from "@/lib/bracket-scoring";
import type { BracketMatch, BracketPick } from "@/lib/firestore/bracket";

interface Props {
  matches: BracketMatch[];
  allPicks: BracketPick[];
  currentUserId: string | null;
  isFinished: boolean;
}

interface RankedEntry {
  rank: number;
  userId: string;
  userName: string;
  total: number;
  delta: number;
  isCurrentUser: boolean;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function BracketLeaderboard({ matches, allPicks, currentUserId, isFinished }: Props) {
  const t = useTranslation();
  const b = t.bracket;

  const finalMatch = matches.find((m) => m.id === "final");

  const ranked = useMemo<RankedEntry[]>(() => {
    const entries = allPicks.map((pick) => ({
      userId: pick.userId,
      userName: pick.userName || pick.userId.slice(0, 8),
      total: calculateUserScore(pick, matches).total,
      delta: tiebreakerDelta(pick, finalMatch),
      isCurrentUser: pick.userId === currentUserId,
    }));

    entries.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.delta - b.delta;
    });

    let rank = 1;
    return entries.map((e, i) => {
      if (i > 0) {
        const prev = entries[i - 1];
        if (e.total !== prev.total || e.delta !== prev.delta) rank = i + 1;
      }
      return { ...e, rank };
    });
  }, [allPicks, matches, currentUserId, finalMatch]);

  if (allPicks.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm" style={{ color: "#6a5a35" }}>
        {b.leaderboardEmpty}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <h2 className="text-base font-bold text-white">{b.leaderboard}</h2>

      <div className="flex flex-col gap-2">
        {ranked.map((entry) => {
          const medal = entry.rank <= 3 ? MEDALS[entry.rank - 1] : null;
          const isWinner = isFinished && entry.rank === 1;
          const isMe = entry.isCurrentUser;

          return (
            <div
              key={entry.userId}
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={
                isMe
                  ? { background: "rgba(240,192,64,0.14)", border: "1.5px solid rgba(240,192,64,0.5)" }
                  : entry.rank === 1
                  ? { background: "rgba(240,192,64,0.07)", border: "1px solid rgba(240,192,64,0.25)" }
                  : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }
              }
            >
              {/* Rank */}
              <span
                className="w-7 text-center text-sm font-bold flex-shrink-0"
                style={{ color: medal ? "#f0c040" : "#5a4a25" }}
              >
                {medal ?? `${entry.rank}`}
              </span>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: isMe ? "#f0c040" : "#e0d0a0" }}
                >
                  {entry.userName}
                  {isMe && (
                    <span className="ml-1 text-xs font-normal" style={{ color: "#a0905a" }}>
                      {b.leaderboardYou}
                    </span>
                  )}
                </p>
                {isWinner && (
                  <p className="text-xs mt-0.5" style={{ color: "#f0c040" }}>
                    {b.leaderboardWinner}
                  </p>
                )}
              </div>

              {/* Score */}
              <span
                className="text-sm font-bold flex-shrink-0"
                style={{ color: entry.rank === 1 ? "#f0c040" : "#c0aa78" }}
              >
                {entry.total} {b.leaderboardPts}
              </span>
            </div>
          );
        })}
      </div>

      {finalMatch?.winner && (
        <p className="text-center text-xs mt-1" style={{ color: "#5a4a25" }}>
          {b.leaderboardTiebreak}: {finalMatch.scoreA}–{finalMatch.scoreB}
        </p>
      )}
    </div>
  );
}
