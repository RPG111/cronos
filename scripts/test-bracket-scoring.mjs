/**
 * test-bracket-scoring.mjs — Escenario completo de scoring y leaderboard.
 *
 * Uso:
 *   node scripts/test-bracket-scoring.mjs          → corre escenario completo
 *   node scripts/test-bracket-scoring.mjs --reset  → limpia datos de prueba
 *
 * Requiere: seed-bracket.mjs ejecutado primero (los 32 docs de partidos deben existir).
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
      projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}
const db = admin.firestore();

const MATCHES_COL = "wc2026_bracket_matches";
const PICKS_COL   = "wc2026_bracket_picks";
const CONFIG_COL  = "wc2026_bracket_config";

// ── Puntos por ronda (espejo exacto de src/lib/firestore/bracket.ts) ──────────
const ROUND_POINTS = { r32: 1, r16: 2, qf: 4, sf: 6, third: 6, final: 10 };

// ── Equipos de prueba para R32 ────────────────────────────────────────────────
const TEST_TEAMS = [
  ["México",       "Ecuador"],        // r32-1
  ["EE. UU.",      "Bélgica"],        // r32-2
  ["Canadá",       "Marruecos"],      // r32-3
  ["Brasil",       "Croacia"],        // r32-4
  ["Argentina",    "Australia"],      // r32-5
  ["Francia",      "Corea del Sur"],  // r32-6
  ["España",       "Arabia Saudita"], // r32-7
  ["Inglaterra",   "Senegal"],        // r32-8
  ["Alemania",     "Japón"],          // r32-9
  ["Portugal",     "Uruguay"],        // r32-10
  ["Países Bajos", "Polonia"],        // r32-11
  ["Italia",       "Chile"],          // r32-12
  ["Colombia",     "Ghana"],          // r32-13
  ["Suiza",        "Serbia"],         // r32-14
  ["Dinamarca",    "Camerún"],        // r32-15
  ["Costa Rica",   "Panamá"],         // r32-16
];

// ── Resultados reales simulados [matchId, winner, scoreA, scoreB] ─────────────
//
// R32: gana siempre teamA (el primer equipo de TEST_TEAMS).
// Los ganadores se propagan automáticamente vía feedsInto a r16, qf, sf.
//
// Árbol resultante:
//   R16: México, Brasil, Argentina, España, Alemania, Países Bajos, Colombia, Dinamarca
//   QF:  Brasil, Argentina, Alemania, Colombia
//   SF:  Argentina (loser=Brasil→third teamA), Alemania (loser=Colombia→third teamB)
//   3er: Brasil 3-1 Colombia
//   Final: Argentina 3-1 Alemania
const REAL_RESULTS = [
  // R32
  ["r32-1",  "México",        2, 1], ["r32-2",  "EE. UU.",       1, 0],
  ["r32-3",  "Canadá",        1, 0], ["r32-4",  "Brasil",        3, 1],
  ["r32-5",  "Argentina",     2, 0], ["r32-6",  "Francia",       2, 1],
  ["r32-7",  "España",        1, 0], ["r32-8",  "Inglaterra",    2, 0],
  ["r32-9",  "Alemania",      3, 2], ["r32-10", "Portugal",      2, 1],
  ["r32-11", "Países Bajos",  2, 0], ["r32-12", "Italia",        1, 0],
  ["r32-13", "Colombia",      2, 1], ["r32-14", "Suiza",         1, 0],
  ["r32-15", "Dinamarca",     2, 0], ["r32-16", "Costa Rica",    1, 0],
  // R16 (teamA/teamB propagados por feedsInto de r32)
  ["r16-1",  "México",        2, 1], ["r16-2",  "Brasil",        2, 0],
  ["r16-3",  "Argentina",     2, 1], ["r16-4",  "España",        1, 0],
  ["r16-5",  "Alemania",      2, 1], ["r16-6",  "Países Bajos",  2, 1],
  ["r16-7",  "Colombia",      1, 0], ["r16-8",  "Dinamarca",     2, 0],
  // QF
  ["qf-1",   "Brasil",        2, 1], ["qf-2",   "Argentina",     1, 0],
  ["qf-3",   "Alemania",      2, 1], ["qf-4",   "Colombia",      1, 0],
  // SF  (perdedores van a "third" por la lógica de setMatchResult)
  ["sf-1",   "Argentina",     2, 1],
  ["sf-2",   "Alemania",      2, 0],
  // Tercer lugar y Final
  ["third",  "Brasil",        3, 1],
  ["final",  "Argentina",     3, 1],
];

// ── Picks de los 3 usuarios de prueba ─────────────────────────────────────────
//
// Alice:  todos correctos                 → 76 pts, Δ=0
// Bob:    r32×4 + qf-2 + final           → 18 pts, Δ=1  (gana el desempate)
// Carlos: r32×4 + qf-2 + final (≠ Bob)  → 18 pts, Δ=2  (pierde el desempate)
//
// Verificación manual:
//   Alice:  16×1 + 8×2 + 4×4 + 2×6 + 1×6 + 1×10 = 16+16+16+12+6+10 = 76
//   Bob:    4×1 + 0×2 + 1×4 + 0×6 + 0×6 + 1×10  =  4+ 0+ 4+ 0+0+10 = 18
//   Carlos: 4×1 + 0×2 + 1×4 + 0×6 + 0×6 + 1×10  =  4+ 0+ 4+ 0+0+10 = 18
const TEST_PICKS = [
  {
    userId:   "test-alice-001",
    userName: "Alice (muchos aciertos)",
    picks: {
      // R32: los 16 correctos
      "r32-1":"México",       "r32-2":"EE. UU.",      "r32-3":"Canadá",
      "r32-4":"Brasil",       "r32-5":"Argentina",    "r32-6":"Francia",
      "r32-7":"España",       "r32-8":"Inglaterra",   "r32-9":"Alemania",
      "r32-10":"Portugal",    "r32-11":"Países Bajos","r32-12":"Italia",
      "r32-13":"Colombia",    "r32-14":"Suiza",        "r32-15":"Dinamarca",
      "r32-16":"Costa Rica",
      // R16: los 8 correctos
      "r16-1":"México",       "r16-2":"Brasil",       "r16-3":"Argentina",
      "r16-4":"España",       "r16-5":"Alemania",     "r16-6":"Países Bajos",
      "r16-7":"Colombia",     "r16-8":"Dinamarca",
      // QF: los 4 correctos
      "qf-1":"Brasil",        "qf-2":"Argentina",
      "qf-3":"Alemania",      "qf-4":"Colombia",
      // SF: los 2 correctos
      "sf-1":"Argentina",     "sf-2":"Alemania",
      // Tercer lugar: correcto
      "third":"Brasil",
      // Final: correcto
      "final":"Argentina",
    },
    finalScorePrediction: { scoreA: 3, scoreB: 1 }, // delta = |3-3|+|1-1| = 0
  },
  {
    userId:   "test-bob-001",
    userName: "Bob (pocos aciertos, empate Δ=1)",
    picks: {
      // R32: 4 correctos (r32-1,5,9,13), 12 incorrectos (losers del real resultado)
      "r32-1":"México",         "r32-2":"Bélgica",        "r32-3":"Marruecos",
      "r32-4":"Croacia",        "r32-5":"Argentina",      "r32-6":"Corea del Sur",
      "r32-7":"Arabia Saudita", "r32-8":"Senegal",        "r32-9":"Alemania",
      "r32-10":"Uruguay",       "r32-11":"Polonia",       "r32-12":"Chile",
      "r32-13":"Colombia",      "r32-14":"Serbia",        "r32-15":"Camerún",
      "r32-16":"Panamá",
      // R16: todos incorrectos — equipos eliminados en R32
      "r16-1":"Bélgica",        "r16-2":"Marruecos",      "r16-3":"Corea del Sur",
      "r16-4":"Arabia Saudita", "r16-5":"Uruguay",        "r16-6":"Polonia",
      "r16-7":"Serbia",         "r16-8":"Camerún",
      // QF: 1 correcto (qf-2 Argentina), 3 incorrectos
      "qf-1":"Bélgica",         "qf-2":"Argentina",
      "qf-3":"Uruguay",         "qf-4":"Serbia",
      // SF: ambos incorrectos
      "sf-1":"Bélgica",         "sf-2":"Uruguay",
      // Tercer lugar: incorrecto
      "third":"Serbia",
      // Final: correcto
      "final":"Argentina",
    },
    finalScorePrediction: { scoreA: 4, scoreB: 1 }, // delta = |4-3|+|1-1| = 1
  },
  {
    userId:   "test-carlos-001",
    userName: "Carlos (pocos aciertos, empate Δ=2)",
    picks: {
      // R32: 4 correctos (r32-1,3,5,7) — distintos a los de Bob
      "r32-1":"México",         "r32-2":"Bélgica",        "r32-3":"Canadá",
      "r32-4":"Croacia",        "r32-5":"Argentina",      "r32-6":"Corea del Sur",
      "r32-7":"España",         "r32-8":"Senegal",        "r32-9":"Japón",
      "r32-10":"Uruguay",       "r32-11":"Polonia",       "r32-12":"Chile",
      "r32-13":"Ghana",         "r32-14":"Serbia",        "r32-15":"Camerún",
      "r32-16":"Panamá",
      // R16: todos incorrectos
      // Nota: Carlos predijo Canadá para r32-3 (correcto), Canadá llega a r16-2 teamA
      // pero pierde. Carlos pone "Canadá" para r16-2 → incorrecto (gana Brasil).
      // Carlos predijo España para r32-7 (correcto), España llega a r16-4 teamA y gana.
      // Pero Carlos predice "Senegal" para r16-4 (su r32-8 pick) → incorrecto. ✓
      "r16-1":"Bélgica",        "r16-2":"Canadá",         "r16-3":"Corea del Sur",
      "r16-4":"Senegal",        "r16-5":"Japón",          "r16-6":"Polonia",
      "r16-7":"Ghana",          "r16-8":"Camerún",
      // QF: 1 correcto (qf-2 Argentina), 3 incorrectos
      "qf-1":"Bélgica",         "qf-2":"Argentina",
      "qf-3":"Japón",           "qf-4":"Ghana",
      // SF: ambos incorrectos
      "sf-1":"Bélgica",         "sf-2":"Japón",
      // Tercer lugar: incorrecto
      "third":"Ghana",
      // Final: correcto
      "final":"Argentina",
    },
    finalScorePrediction: { scoreA: 1, scoreB: 1 }, // delta = |1-3|+|1-1| = 2
  },
];

// ── Scoring puro (espejo exacto de src/lib/bracket-scoring.ts) ───────────────
function calculateUserScore(pick, matches) {
  const breakdown = { r32: 0, r16: 0, qf: 0, sf: 0, third: 0, final: 0 };
  for (const match of matches) {
    if (!match.winner) continue;
    const userPick = pick.picks[match.id];
    if (!userPick) continue;
    if (userPick === match.winner) {
      breakdown[match.round] += ROUND_POINTS[match.round];
    }
  }
  return {
    total: Object.values(breakdown).reduce((s, v) => s + v, 0),
    breakdown,
  };
}

function tiebreakerDelta(pick, finalMatch) {
  if (!finalMatch || finalMatch.scoreA == null || finalMatch.scoreB == null) return Infinity;
  const p = pick.finalScorePrediction;
  return Math.abs(p.scoreA - finalMatch.scoreA) + Math.abs(p.scoreB - finalMatch.scoreB);
}

// ── setMatchResult (espejo exacto de src/lib/firestore/bracket.ts) ────────────
async function setMatchResult(matchId, winner, scoreA, scoreB) {
  const ref  = db.collection(MATCHES_COL).doc(matchId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Partido ${matchId} no encontrado`);
  const match = { id: snap.id, ...snap.data() };
  const loser = match.teamA === winner ? match.teamB : match.teamA;

  await ref.update({ winner, scoreA, scoreB });

  if (match.feedsInto) {
    const field = match.feedsInto.slot === "A" ? "teamA" : "teamB";
    await db.collection(MATCHES_COL).doc(match.feedsInto.matchId).update({ [field]: winner });
  }

  // Perdedores de semis van al partido por el tercer lugar
  if ((matchId === "sf-1" || matchId === "sf-2") && loser) {
    const field = matchId === "sf-1" ? "teamA" : "teamB";
    await db.collection(MATCHES_COL).doc("third").update({ [field]: loser });
  }
}

// ── Helpers de output ─────────────────────────────────────────────────────────
const W = 57;
const SEP  = "─".repeat(W);
const DSEP = "═".repeat(W);

function printScoreBlock(pick, result, finalMatch) {
  const delta = tiebreakerDelta(pick, finalMatch);
  const pred  = pick.finalScorePrediction;

  const ROUND_CONFIG = [
    { key: "r32",   label: "R32       ", total: 16, n: 16 },
    { key: "r16",   label: "R16       ", total: 16, n:  8 },
    { key: "qf",    label: "Cuartos   ", total: 16, n:  4 },
    { key: "sf",    label: "Semis     ", total: 12, n:  2 },
    { key: "third", label: "3er lugar ", total:  6, n:  1 },
    { key: "final", label: "Final     ", total: 10, n:  1 },
  ];

  console.log(`\n  ◆ ${pick.userName}`);
  for (const { key, label, total, n } of ROUND_CONFIG) {
    const pts     = result.breakdown[key];
    const correct = pts / ROUND_POINTS[key];
    const bar     = "█".repeat(correct) + "░".repeat(n - correct);
    console.log(`    ${label} ${String(pts).padStart(3)} pts  [${bar}]  ${correct}/${n}`);
  }
  const deltaStr = delta === Infinity ? "∞" : String(delta);
  console.log(`    ${"TOTAL".padEnd(10)} ${String(result.total).padStart(3)} pts  │  ΔFinal=${deltaStr}  (predicho: ${pred.scoreA}–${pred.scoreB})`);
}

// ── Función principal ─────────────────────────────────────────────────────────
async function run() {
  console.log("\n" + DSEP);
  console.log("  TEST BRACKET SCORING — Cronos Bracket Challenge");
  console.log(DSEP);

  // Verificar que los partidos existen (seed-bracket.mjs requerido)
  const checkSnap = await db.collection(MATCHES_COL).doc("r32-1").get();
  if (!checkSnap.exists) {
    console.error("\n❌  Los partidos no existen. Ejecuta primero:\n    node scripts/seed-bracket.mjs\n");
    process.exit(1);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // FASE 1 — Limpiar estado + poblar R32 + abrir bracket
  // ────────────────────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(W)}`);
  console.log("  FASE 1  equipos de prueba + config → open");
  console.log(SEP);

  // Resetear todos los partidos (limpia cualquier estado previo)
  const allMatchIds = [
    ...Array.from({ length: 16 }, (_, i) => `r32-${i + 1}`),
    ...Array.from({ length:  8 }, (_, i) => `r16-${i + 1}`),
    "qf-1","qf-2","qf-3","qf-4","sf-1","sf-2","third","final",
  ];
  for (const id of allMatchIds) {
    await db.collection(MATCHES_COL).doc(id).update({
      teamA: null, teamB: null, winner: null, scoreA: null, scoreB: null,
    });
  }
  console.log("  ✓ Todos los partidos reseteados a null");

  // Poblar equipos en R32
  for (let i = 0; i < 16; i++) {
    const id = `r32-${i + 1}`;
    await db.collection(MATCHES_COL).doc(id).update({
      teamA: TEST_TEAMS[i][0],
      teamB: TEST_TEAMS[i][1],
    });
  }
  console.log("  ✓ 16 partidos R32 poblados con 32 equipos de prueba");

  await db.collection(CONFIG_COL).doc("config").update({ status: "open" });
  console.log("  ✓ config.status → open");

  // ────────────────────────────────────────────────────────────────────────────
  // FASE 2 — Guardar picks de los 3 usuarios
  // ────────────────────────────────────────────────────────────────────────────
  console.log(`\n${SEP}`);
  console.log("  FASE 2  guardando picks");
  console.log(SEP);

  for (const pick of TEST_PICKS) {
    await db.collection(PICKS_COL).doc(pick.userId).set({
      ...pick,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt:   admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  ✓ ${pick.userName}  (${pick.userId})`);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // FASE 3 — Bloquear bracket + capturar resultados reales ronda a ronda
  // ────────────────────────────────────────────────────────────────────────────
  console.log(`\n${SEP}`);
  console.log("  FASE 3  config → locked + resultados reales");
  console.log(SEP);

  await db.collection(CONFIG_COL).doc("config").update({ status: "locked" });
  console.log("  ✓ config.status → locked\n");

  const roundOrder = ["r32", "r16", "qf", "sf", "third", "final"];
  for (const round of roundOrder) {
    const roundResults = REAL_RESULTS.filter(([id]) => {
      if (round === "third") return id === "third";
      if (round === "final") return id === "final";
      return id.startsWith(round + "-");
    });
    if (!roundResults.length) continue;

    const label = {
      r32: "R32      ", r16: "R16      ", qf: "Cuartos  ",
      sf: "Semis    ", third: "3er lugar", final: "Final    ",
    }[round];

    process.stdout.write(`  ${label}: `);
    for (const [matchId, winner, scoreA, scoreB] of roundResults) {
      await setMatchResult(matchId, winner, scoreA, scoreB);
      process.stdout.write(`${matchId}→${winner}  `);
    }
    console.log();
  }

  // Verificar propagación de feedsInto leyendo la final desde Firestore
  const finalSnap = await db.collection(MATCHES_COL).doc("final").get();
  const fd = finalSnap.data();
  console.log(`\n  Propagación feedsInto verificada:`);
  console.log(`    final.teamA = "${fd.teamA}"  (esperado: Argentina)`);
  console.log(`    final.teamB = "${fd.teamB}"  (esperado: Alemania)`);
  const thirdSnap = await db.collection(MATCHES_COL).doc("third").get();
  const td = thirdSnap.data();
  console.log(`    third.teamA = "${td.teamA}"  (esperado: Brasil — loser sf-1)`);
  console.log(`    third.teamB = "${td.teamB}"  (esperado: Colombia — loser sf-2)`);

  // ────────────────────────────────────────────────────────────────────────────
  // FASE 4 — Finalizar bracket
  // ────────────────────────────────────────────────────────────────────────────
  console.log(`\n${SEP}`);
  console.log("  FASE 4  config → finished");
  console.log(SEP);

  await db.collection(CONFIG_COL).doc("config").update({ status: "finished" });
  console.log("  ✓ config.status → finished");

  // ────────────────────────────────────────────────────────────────────────────
  // FASE 5 — Leer datos desde Firestore y calcular scores
  // ────────────────────────────────────────────────────────────────────────────
  console.log(`\n${SEP}`);
  console.log("  FASE 5  leyendo Firestore + calculando scores");
  console.log(SEP);

  const matchSnap = await db.collection(MATCHES_COL).get();
  const matches   = matchSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const finalMatch = matches.find((m) => m.id === "final");

  const pickSnap = await db.collection(PICKS_COL)
    .where("userId", "in", TEST_PICKS.map((p) => p.userId))
    .get();
  console.log(`  Partidos cargados: ${matches.length}`);
  console.log(`  Picks cargados:    ${pickSnap.size}`);
  console.log(`  Final real:        ${finalMatch?.teamA} ${finalMatch?.scoreA}–${finalMatch?.scoreB} ${finalMatch?.teamB}  →  ganador: ${finalMatch?.winner}`);

  const EXPECTED = {
    "test-alice-001": 76,
    "test-bob-001":   18,
    "test-carlos-001": 18,
  };

  const scoredEntries = TEST_PICKS.map((pick) => {
    const result = calculateUserScore(pick, matches);
    const delta  = tiebreakerDelta(pick, finalMatch);
    return { pick, result, delta };
  });

  // ── Desglose por usuario ───────────────────────────────────────────────────
  console.log(`\n${DSEP}`);
  console.log("  DESGLOSE DE PUNTOS POR RONDA");
  console.log(DSEP);

  for (const { pick, result } of scoredEntries) {
    printScoreBlock(pick, result, finalMatch);
    const exp  = EXPECTED[pick.userId];
    const ok   = result.total === exp;
    console.log(`    Verificación total: ${result.total} pts ${ok ? "==" : "!="} ${exp} esperado  ${ok ? "✅" : "❌ ERROR"}`);
  }

  // ── Leaderboard ────────────────────────────────────────────────────────────
  const ranked = [...scoredEntries].sort((a, b) => {
    if (b.result.total !== a.result.total) return b.result.total - a.result.total;
    return a.delta - b.delta;
  });

  console.log(`\n${DSEP}`);
  console.log("  LEADERBOARD FINAL");
  console.log(DSEP);

  const MEDALS = ["🥇", "🥈", "🥉"];
  let rank = 1;
  for (let i = 0; i < ranked.length; i++) {
    const { pick, result, delta } = ranked[i];
    if (i > 0) {
      const prev = ranked[i - 1];
      if (result.total !== prev.result.total || delta !== prev.delta) rank = i + 1;
    }
    const isTied = ranked.some((r, j) => j !== i && r.result.total === result.total);
    const tieNote = isTied ? `  (empate pts=${result.total}, resuelto por Δ=${delta})` : "";
    console.log(`  ${MEDALS[rank - 1] ?? ` #${rank}`}  ${pick.userName.padEnd(38)} ${String(result.total).padStart(3)} pts${tieNote}`);
  }

  // ── Verificaciones ─────────────────────────────────────────────────────────
  console.log(`\n${DSEP}`);
  console.log("  VERIFICACIONES");
  console.log(DSEP);

  const alice  = scoredEntries.find((e) => e.pick.userId === "test-alice-001");
  const bob    = scoredEntries.find((e) => e.pick.userId === "test-bob-001");
  const carlos = scoredEntries.find((e) => e.pick.userId === "test-carlos-001");

  // (a) ROUND_POINTS correcto — verificar contra los máximos posibles de Alice
  const ab = alice.result.breakdown;
  const pointsOk = ab.r32===16 && ab.r16===16 && ab.qf===16 && ab.sf===12 && ab.third===6 && ab.final===10;
  console.log(`\n  (a) ROUND_POINTS aplicados correctamente: ${pointsOk ? "✅" : "❌"}`);
  console.log(`      Alice (todos correctos):`);
  console.log(`        r32  16pts  = 16 aciertos × 1   ${ab.r32===16?"✓":"✗"}`);
  console.log(`        r16  16pts  =  8 aciertos × 2   ${ab.r16===16?"✓":"✗"}`);
  console.log(`        qf   16pts  =  4 aciertos × 4   ${ab.qf===16?"✓":"✗"}`);
  console.log(`        sf   12pts  =  2 aciertos × 6   ${ab.sf===12?"✓":"✗"}`);
  console.log(`        3er   6pts  =  1 acierto  × 6   ${ab.third===6?"✓":"✗"}`);
  console.log(`        final 10pts =  1 acierto  × 10  ${ab.final===10?"✓":"✗"}`);
  console.log(`        TOTAL: ${alice.result.total} pts  (máximo teórico: 76)`);

  // (b) Equipos eliminados no suman
  const bobR16 = bob.result.breakdown.r16;
  const eliminatedOk = bobR16 === 0;
  console.log(`\n  (b) Picks de equipos eliminados no suman: ${eliminatedOk ? "✅" : "❌"}`);
  console.log(`      Bob predijo "Bélgica" para r16-1 (Bélgica eliminada en r32-2)`);
  console.log(`      Bob predijo "Polonia" para r16-6 (Polonia eliminada en r32-11)`);
  console.log(`      Puntos R16 de Bob: ${bobR16} pts  (esperado: 0)  ${eliminatedOk?"✓":"✗"}`);
  console.log(`      Canadá llegó a r16-2 pero Carlos puso "Canadá" → pierde vs Brasil → 0 pts`);

  // (c) Desempate por marcador de la final
  const bobRank    = ranked.indexOf(bob) + 1;
  const carlosRank = ranked.indexOf(carlos) + 1;
  const tieTotal   = bob.result.total === carlos.result.total;
  const deltaOk    = bob.delta < carlos.delta;
  const orderOk    = bobRank < carlosRank;
  const tieOk      = tieTotal && deltaOk && orderOk;
  console.log(`\n  (c) Desempate por marcador final: ${tieOk ? "✅" : "❌"}`);
  console.log(`      Marcador real:      Argentina 3 – 1 Alemania`);
  console.log(`      Bob   predijo 4–1 → Δ = |4-3|+|1-1| = ${bob.delta}   → posición #${bobRank}`);
  console.log(`      Carlos predijo 1–1 → Δ = |1-3|+|1-1| = ${carlos.delta}   → posición #${carlosRank}`);
  console.log(`      Mismos ${bob.result.total} pts → menor Δ gana → Bob supera a Carlos ${orderOk?"✓":"✗"}`);

  // Resumen final
  const allOk = pointsOk && eliminatedOk && tieOk
    && alice.result.total  === 76
    && bob.result.total    === 18
    && carlos.result.total === 18;

  console.log(`\n${DSEP}`);
  if (allOk) {
    console.log("  ✅  TODOS LOS CHECKS PASARON — scoring y leaderboard funcionan correctamente");
  } else {
    console.log("  ❌  ALGÚN CHECK FALLÓ — revisar output arriba");
  }
  console.log(DSEP);
  console.log("  Corre con --reset para limpiar los datos de prueba de Firestore.\n");
}

// ── Reset ─────────────────────────────────────────────────────────────────────
async function reset() {
  console.log("\n" + DSEP);
  console.log("  TEST BRACKET SCORING — RESET");
  console.log(DSEP);

  console.log("\n── Borrando picks de prueba…");
  for (const pick of TEST_PICKS) {
    await db.collection(PICKS_COL).doc(pick.userId).delete();
    console.log(`  ✓ borrado: ${pick.userId}`);
  }

  console.log("\n── Reseteando config → closed…");
  await db.collection(CONFIG_COL).doc("config").update({ status: "closed" });
  console.log("  ✓ config.status → closed");

  console.log("\n── Limpiando todos los partidos…");
  const allMatchIds = [
    ...Array.from({ length: 16 }, (_, i) => `r32-${i + 1}`),
    ...Array.from({ length:  8 }, (_, i) => `r16-${i + 1}`),
    "qf-1","qf-2","qf-3","qf-4","sf-1","sf-2","third","final",
  ];
  for (const id of allMatchIds) {
    await db.collection(MATCHES_COL).doc(id).update({
      teamA: null, teamB: null, winner: null, scoreA: null, scoreB: null,
    });
    process.stdout.write(`  ↺ ${id}  `);
  }

  console.log(`\n\n${DSEP}`);
  console.log("  ✅  Reset completo — estado inicial restaurado (closed / null teams)");
  console.log(DSEP + "\n");
}

// ── Entry point ───────────────────────────────────────────────────────────────
const RESET = process.argv.includes("--reset");
(RESET ? reset() : run()).catch((err) => {
  console.error("\n❌  Error:", err.message ?? err);
  process.exit(1);
});
