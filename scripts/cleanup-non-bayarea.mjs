/**
 * cleanup-non-bayarea.mjs
 *
 * Uso:
 *   node scripts/cleanup-non-bayarea.mjs          ← solo lista (DRY RUN)
 *   node scripts/cleanup-non-bayarea.mjs --delete  ← borra de verdad
 *
 * Lógica KEEP:
 *   - country === "bay_area"  → KEEP
 *   - ID empieza con "ba-", "sf-", "oak-", "fan-zone-" → KEEP
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const DELETE_MODE = process.argv.includes("--delete");

// ── .env.local ────────────────────────────────────────────────────────────────
const envPath = resolve(process.cwd(), ".env.local");
const raw = readFileSync(envPath, "utf-8");
for (const line of raw.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim().replace(/^"(.*)"$/, "$1");
  if (!process.env[key]) process.env[key] = val;
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

const BAY_AREA_PREFIXES = ["ba-", "sf-", "oak-", "fan-zone-"];

function isBayArea(id, data) {
  if (data.country === "bay_area") return true;
  if (BAY_AREA_PREFIXES.some((p) => id.startsWith(p))) return true;
  return false;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  const mode = DELETE_MODE ? "🗑  BORRADO REAL" : "🔍  MODO LISTA (DRY RUN — sin borrar)";
  console.log(`\n=== cleanup-non-bayarea.mjs | ${mode} ===\n`);

  const snap = await db.collection("wc2026_fanzones").get();
  const all = snap.docs.map((d) => ({ id: d.id, ref: d.ref, data: d.data() }));

  const toKeep   = all.filter((d) =>  isBayArea(d.id, d.data));
  const toDelete = all.filter((d) => !isBayArea(d.id, d.data));

  console.log(`Total en Firestore : ${all.length}`);
  console.log(`A conservar (Bay Area): ${toKeep.length}`);
  console.log(`A borrar (non-Bay-Area): ${toDelete.length}\n`);

  // ── Tabla completa ───────────────────────────────────────────────────────────
  const col1 = Math.max(...toDelete.map((d) => d.id.length), 4);
  const col2 = Math.max(...toDelete.map((d) => (d.data.name ?? "").length), 6);
  const col3 = Math.max(...toDelete.map((d) => (d.data.country ?? "(sin country)").length), 7);

  const header = "ID".padEnd(col1) + "  " + "Nombre".padEnd(col2) + "  " + "Country".padEnd(col3);
  const sep = "─".repeat(header.length);

  console.log(sep);
  console.log(header);
  console.log(sep);

  // Sort by country then id
  toDelete.sort((a, b) => {
    const ca = a.data.country ?? "";
    const cb = b.data.country ?? "";
    if (ca !== cb) return ca.localeCompare(cb);
    return a.id.localeCompare(b.id);
  });

  for (const d of toDelete) {
    const name    = (d.data.name ?? "(sin nombre)").padEnd(col2);
    const country = (d.data.country ?? "(sin country)").padEnd(col3);
    const warn    = !d.data.country ? "  ⚠️  SIN COUNTRY" : "";
    console.log(`${d.id.padEnd(col1)}  ${name}  ${country}${warn}`);
  }
  console.log(sep);

  // ── Sin-country special report ───────────────────────────────────────────────
  const sinCountry = toDelete.filter((d) => !d.data.country);
  if (sinCountry.length > 0) {
    console.log("\n⚠️  DOCUMENTOS SIN COUNTRY (revisar antes de borrar):");
    for (const d of sinCountry) {
      console.log(`  ID      : ${d.id}`);
      console.log(`  Nombre  : ${d.data.name ?? "(sin nombre)"}`);
      console.log(`  City    : ${d.data.city ?? "(sin city)"}`);
      console.log(`  Address : ${d.data.address ?? "(sin address)"}`);
      console.log(`  lat/lng : ${d.data.lat ?? "?"} / ${d.data.lng ?? "?"}`);
      console.log(`  Todos los campos: ${JSON.stringify(d.data)}`);
    }
  }

  if (!DELETE_MODE) {
    console.log("\n──────────────────────────────────────────────────────");
    console.log("DRY RUN completado. Para borrar de verdad ejecuta:");
    console.log("  node scripts/cleanup-non-bayarea.mjs --delete");
    console.log("──────────────────────────────────────────────────────\n");
    return;
  }

  // ── BORRADO ─────────────────────────────────────────────────────────────────
  console.log(`\nIniciando borrado de ${toDelete.length} documentos...`);

  const BATCH_SIZE = 400;
  for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = toDelete.slice(i, i + BATCH_SIZE);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    console.log(`  Borrados ${Math.min(i + BATCH_SIZE, toDelete.length)} / ${toDelete.length}...`);
  }

  // ── Verificación final ───────────────────────────────────────────────────────
  const finalSnap = await db.collection("wc2026_fanzones").get();
  const finalDocs = finalSnap.docs.map((d) => ({ id: d.id, data: d.data() }));

  const countByCountry = {};
  for (const d of finalDocs) {
    const c = d.data.country ?? "(sin country)";
    countByCountry[c] = (countByCountry[c] ?? 0) + 1;
  }

  const finalNonBa = finalDocs.filter((d) => !isBayArea(d.id, d.data));

  console.log("\n" + "═".repeat(55));
  console.log("VERIFICACIÓN FINAL");
  console.log("═".repeat(55));
  console.log(`Total documentos restantes : ${finalSnap.size}`);
  console.log("\nPor country:");
  for (const [country, count] of Object.entries(countByCountry).sort()) {
    console.log(`  ${country.padEnd(22)} : ${count}`);
  }
  console.log(`\nDocumentos non-Bay-Area    : ${finalNonBa.length}  ← debe ser 0`);

  if (finalNonBa.length === 0) {
    console.log("\n✅  LIMPIO — Solo quedan Fan Zones del Bay Area.");
  } else {
    console.log("\n⚠️  QUEDAN documentos fuera del Bay Area:");
    finalNonBa.forEach((d) =>
      console.log(`  ${d.id}  |  country: ${d.data.country ?? "(sin country)"}`)
    );
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
