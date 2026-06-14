// src/lib/firestore/bracket.ts
import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";

export type BracketRound = "r32" | "r16" | "qf" | "sf" | "third" | "final";

export interface BracketMatch {
  id: string;              // "r32-1"…"r32-16", "r16-1"…"r16-8", "qf-1"…"qf-4", "sf-1", "sf-2", "third", "final"
  round: BracketRound;
  matchNumber: number;
  teamA: string | null;   // null = TBD hasta el 27 jun
  teamB: string | null;
  scheduledDate: string | null;   // ISO, se llenará cuando esté el calendario oficial
  winner: string | null;          // lo captura el admin con el resultado real
  scoreA: number | null;
  scoreB: number | null;
  feedsInto: { matchId: string; slot: "A" | "B" } | null;  // a qué partido avanza el ganador; null en "third" y "final"
}

export interface BracketPick {
  userId: string;
  userName: string;       // denormalizado para el leaderboard
  picks: Record<string, string>;  // matchId -> nombre del equipo predicho como ganador
  finalScorePrediction: { scoreA: number; scoreB: number };  // desempate
  submittedAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BracketConfig {
  status: "closed" | "open" | "locked" | "finished";
  opensAt: Timestamp | null;
  locksAt: Timestamp | null;  // kickoff del primer partido de R32
  prize: string;              // "$200"
}

export const ROUND_POINTS: Record<BracketRound, number> = {
  r32: 1,
  r16: 2,
  qf: 4,
  sf: 6,
  third: 6,
  final: 10,
};

const MATCHES_COL = "wc2026_bracket_matches";
const PICKS_COL = "wc2026_bracket_picks";
const CONFIG_COL = "wc2026_bracket_config";

const ROUND_ORDER: BracketRound[] = ["r32", "r16", "qf", "sf", "third", "final"];

export async function getBracketMatches(): Promise<BracketMatch[]> {
  const snap = await getDocs(collection(db, MATCHES_COL));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as BracketMatch))
    .sort((a, b) => {
      const ri = ROUND_ORDER.indexOf(a.round) - ROUND_ORDER.indexOf(b.round);
      if (ri !== 0) return ri;
      return a.matchNumber - b.matchNumber;
    });
}

export async function getBracketConfig(): Promise<BracketConfig | null> {
  const snap = await getDoc(doc(db, CONFIG_COL, "config"));
  if (!snap.exists()) return null;
  return snap.data() as BracketConfig;
}

export async function getUserPick(userId: string): Promise<BracketPick | null> {
  const snap = await getDoc(doc(db, PICKS_COL, userId));
  if (!snap.exists()) return null;
  return snap.data() as BracketPick;
}

export async function saveUserPick(
  pick: Omit<BracketPick, "submittedAt" | "updatedAt"> & { submittedAt?: Timestamp }
): Promise<void> {
  const config = await getBracketConfig();
  if (!config || config.status !== "open") {
    throw new Error("El bracket no está abierto para edición.");
  }
  const ref = doc(db, PICKS_COL, pick.userId);
  const existing = await getDoc(ref);
  await setDoc(ref, {
    ...pick,
    submittedAt: existing.exists() ? existing.data()!.submittedAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// Para el leaderboard futuro — solo admins pueden leer esta colección completa
export async function getAllPicks(): Promise<BracketPick[]> {
  const snap = await getDocs(collection(db, PICKS_COL));
  return snap.docs.map((d) => d.data() as BracketPick);
}
