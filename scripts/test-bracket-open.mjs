/**
 * test-bracket-open.mjs — Configura el bracket para pruebas locales.
 *
 * Uso:
 *   node scripts/test-bracket-open.mjs          → rellena equipos + abre el bracket
 *   node scripts/test-bracket-open.mjs --reset  → limpia equipos + cierra el bracket
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

// ── Equipos de prueba (32 selecciones plausibles del Mundial 2026) ─────────────
// Cada par [teamA, teamB] corresponde a r32-1 … r32-16
const TEST_TEAMS = [
  ["México",        "Ecuador"],
  ["EE. UU.",       "Bélgica"],
  ["Canadá",        "Marruecos"],
  ["Brasil",        "Croacia"],
  ["Argentina",     "Australia"],
  ["Francia",       "Corea del Sur"],
  ["España",        "Arabia Saudita"],
  ["Inglaterra",    "Senegal"],
  ["Alemania",      "Japón"],
  ["Portugal",      "Uruguay"],
  ["Países Bajos",  "Polonia"],
  ["Italia",        "Chile"],
  ["Colombia",      "Ghana"],
  ["Suiza",         "Serbia"],
  ["Dinamarca",     "Camerún"],
  ["Costa Rica",    "Panamá"],
];

const RESET = process.argv.includes("--reset");

async function open() {
  console.log("=== test-bracket-open.mjs — OPEN ===\n");

  // Rellena los 16 partidos de R32 con equipos de prueba
  console.log("── Escribiendo equipos en r32-1…r32-16…");
  for (let i = 0; i < 16; i++) {
    const id = `r32-${i + 1}`;
    await db.collection("wc2026_bracket_matches").doc(id).update({
      teamA: TEST_TEAMS[i][0],
      teamB: TEST_TEAMS[i][1],
    });
    console.log(`  ✓ ${id.padEnd(8)}: ${TEST_TEAMS[i][0]} vs ${TEST_TEAMS[i][1]}`);
  }

  // Abre el bracket
  await db.collection("wc2026_bracket_config").doc("config").update({ status: "open" });
  console.log("\n  ✓ config  →  status=open");

  // Verificación
  const snap = await db.collection("wc2026_bracket_matches").where("round", "==", "r32").get();
  const allFilled = snap.docs.every((d) => d.data().teamA && d.data().teamB);
  const cfg = await db.collection("wc2026_bracket_config").doc("config").get();

  console.log(`\n── Verificación:`);
  console.log(`  R32 equipos rellenos: ${allFilled ? "✅" : "⚠️  algunos nulos"}`);
  console.log(`  config.status       : "${cfg.data()?.status}"`);
  console.log("\n✅ Bracket abierto para pruebas. Corre: npm run dev → /bracket");
}

async function reset() {
  console.log("=== test-bracket-open.mjs — RESET ===\n");

  // Limpia equipos de R32
  console.log("── Limpiando equipos de r32-1…r32-16…");
  for (let i = 1; i <= 16; i++) {
    const id = `r32-${i}`;
    await db.collection("wc2026_bracket_matches").doc(id).update({
      teamA: null,
      teamB: null,
    });
    process.stdout.write(`  ↺ ${id}  `);
  }
  console.log();

  // Cierra el bracket
  await db.collection("wc2026_bracket_config").doc("config").update({ status: "closed" });
  console.log("\n  ✓ config  →  status=closed");
  console.log("\n✅ Bracket reseteado a estado inicial (closed / null teams).");
}

(RESET ? reset() : open()).catch((err) => {
  console.error(err);
  process.exit(1);
});
