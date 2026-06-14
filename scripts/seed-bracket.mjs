/**
 * seed-bracket.mjs — Crea los 32 partidos de la fase eliminatoria del Mundial 2026
 * + doc de configuración del Bracket Challenge.
 *
 * Ejecución: node scripts/seed-bracket.mjs
 *
 * Árbol de avance (ganadores):
 *   r32-1/r32-2  → r16-1  (A/B)     r32-3/r32-4  → r16-2  (A/B)
 *   r32-5/r32-6  → r16-3  (A/B)     r32-7/r32-8  → r16-4  (A/B)
 *   r32-9/r32-10 → r16-5  (A/B)     r32-11/r32-12 → r16-6 (A/B)
 *   r32-13/r32-14 → r16-7 (A/B)     r32-15/r32-16 → r16-8 (A/B)
 *   r16-1/r16-2  → qf-1   (A/B)     r16-3/r16-4  → qf-2   (A/B)
 *   r16-5/r16-6  → qf-3   (A/B)     r16-7/r16-8  → qf-4   (A/B)
 *   qf-1/qf-2    → sf-1   (A/B)     qf-3/qf-4    → sf-2   (A/B)
 *   sf-1/sf-2    → final  (A/B)
 *   Perdedores de sf-1 y sf-2 juegan "third" — NO modelado en feedsInto.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// ── .env.local ────────────────────────────────────────────────────────────────
const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of raw.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  const k = t.slice(0, eq).trim();
  const v = t.slice(eq + 1).trim().replace(/^"(.*)"$/, "$1");
  if (!process.env[k]) process.env[k] = v;
}

// ── Firebase Admin ────────────────────────────────────────────────────────────
const admin = require("firebase-admin");
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}
const db = admin.firestore();

// ── Helpers ───────────────────────────────────────────────────────────────────
function match(id, round, matchNumber, feedsInto) {
  return {
    id,
    round,
    matchNumber,
    teamA: null,
    teamB: null,
    scheduledDate: null,
    winner: null,
    scoreA: null,
    scoreB: null,
    feedsInto: feedsInto ?? null,
  };
}

function into(matchId, slot) {
  return { matchId, slot };
}

// ── Definición de los 32 partidos ─────────────────────────────────────────────
const matches = [
  // ── Ronda de 32 (16 partidos) ────────────────────────────────────────────
  match("r32-1",  "r32",   1, into("r16-1", "A")),
  match("r32-2",  "r32",   2, into("r16-1", "B")),
  match("r32-3",  "r32",   3, into("r16-2", "A")),
  match("r32-4",  "r32",   4, into("r16-2", "B")),
  match("r32-5",  "r32",   5, into("r16-3", "A")),
  match("r32-6",  "r32",   6, into("r16-3", "B")),
  match("r32-7",  "r32",   7, into("r16-4", "A")),
  match("r32-8",  "r32",   8, into("r16-4", "B")),
  match("r32-9",  "r32",   9, into("r16-5", "A")),
  match("r32-10", "r32",  10, into("r16-5", "B")),
  match("r32-11", "r32",  11, into("r16-6", "A")),
  match("r32-12", "r32",  12, into("r16-6", "B")),
  match("r32-13", "r32",  13, into("r16-7", "A")),
  match("r32-14", "r32",  14, into("r16-7", "B")),
  match("r32-15", "r32",  15, into("r16-8", "A")),
  match("r32-16", "r32",  16, into("r16-8", "B")),

  // ── Octavos de final / Round of 16 (8 partidos) ──────────────────────────
  match("r16-1", "r16", 1, into("qf-1", "A")),
  match("r16-2", "r16", 2, into("qf-1", "B")),
  match("r16-3", "r16", 3, into("qf-2", "A")),
  match("r16-4", "r16", 4, into("qf-2", "B")),
  match("r16-5", "r16", 5, into("qf-3", "A")),
  match("r16-6", "r16", 6, into("qf-3", "B")),
  match("r16-7", "r16", 7, into("qf-4", "A")),
  match("r16-8", "r16", 8, into("qf-4", "B")),

  // ── Cuartos de final (4 partidos) ────────────────────────────────────────
  match("qf-1", "qf", 1, into("sf-1", "A")),
  match("qf-2", "qf", 2, into("sf-1", "B")),
  match("qf-3", "qf", 3, into("sf-2", "A")),
  match("qf-4", "qf", 4, into("sf-2", "B")),

  // ── Semifinales (2 partidos) ─────────────────────────────────────────────
  // Nota: el PERDEDOR de sf-1 y sf-2 va a "third" — no se modela en feedsInto
  match("sf-1", "sf", 1, into("final", "A")),
  match("sf-2", "sf", 2, into("final", "B")),

  // ── Tercer lugar ─────────────────────────────────────────────────────────
  match("third", "third", 1, null),

  // ── Final ────────────────────────────────────────────────────────────────
  match("final", "final", 1, null),
];

// ── Seed ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log("=== seed-bracket.mjs — Mundial 2026 Bracket Challenge ===\n");

  // 1. Partidos
  console.log("── Creando partidos…");
  let created = 0;
  let updated = 0;

  for (const m of matches) {
    const { id, ...data } = m;
    const ref = db.collection("wc2026_bracket_matches").doc(id);
    const existing = await ref.get();
    if (existing.exists) {
      await ref.set(data, { merge: true });
      updated++;
      console.log(`  ↺ ${id.padEnd(8)} (actualizado)`);
    } else {
      await ref.set(data);
      created++;
      console.log(`  ✓ ${id.padEnd(8)} round=${data.round} matchNumber=${data.matchNumber}`);
    }
  }

  // 2. Config
  console.log("\n── Creando config…");
  const configRef = db.collection("wc2026_bracket_config").doc("config");
  const configSnap = await configRef.get();
  const configData = {
    status: "closed",
    opensAt: null,
    locksAt: null,
    prize: "$200",
  };
  if (configSnap.exists) {
    console.log("  ↺ config (ya existe — sin cambios para preservar status)");
  } else {
    await configRef.set(configData);
    console.log("  ✓ config  →  status=closed, prize=$200");
  }

  // 3. Verificación en vivo
  console.log("\n── Verificación en vivo…");
  const matchSnap = await db.collection("wc2026_bracket_matches").get();
  const byRound = {};
  for (const d of matchSnap.docs) {
    const r = d.data().round;
    byRound[r] = (byRound[r] ?? 0) + 1;
  }

  const roundOrder = ["r32", "r16", "qf", "sf", "third", "final"];
  let total = 0;
  for (const r of roundOrder) {
    const n = byRound[r] ?? 0;
    total += n;
    console.log(`  ${r.padEnd(8)}: ${n} partido(s)`);
  }
  console.log(`  ${"TOTAL".padEnd(8)}: ${total} partidos`);

  const cfgCheck = await db.collection("wc2026_bracket_config").doc("config").get();
  console.log(`  config    : status="${cfgCheck.data()?.status}", prize="${cfgCheck.data()?.prize}"`);

  console.log(
    `\n✅ Listo — ${created} creados, ${updated} actualizados. Total en Firestore: ${total} partidos + config.`
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
