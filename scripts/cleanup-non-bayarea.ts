/**
 * PASO 2 + PASO 3 — Limpieza Firestore
 *
 * 1. Lista todos los documentos que NO son Bay Area.
 * 2. Borra champions-sf-vikings y champions-mas-bayarea (PASO 2).
 * 3. Borra todos los demás documentos fuera del Bay Area (PASO 3).
 *
 * Lógica de exclusión (igual a deleteNonBayAreaFanZones en seedFanZones.ts):
 *   - country === "bay_area"  → KEEP
 *   - ID empieza con "ba-", "sf-", "oak-", "fan-zone-" → KEEP
 *   - Todo lo demás → DELETE
 *
 * Ejecución:
 *   npx ts-node --project tsconfig.scripts.json scripts/cleanup-non-bayarea.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import admin from "firebase-admin";

// Load .env.local
const envPath = resolve(process.cwd(), ".env.local");
try {
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
} catch {
  console.error("No se pudo leer .env.local");
  process.exit(1);
}

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

const BAY_AREA_ID_PREFIXES = ["ba-", "sf-", "oak-", "fan-zone-"];

function isBayArea(id: string, data: admin.firestore.DocumentData): boolean {
  if (data.country === "bay_area") return true;
  if (BAY_AREA_ID_PREFIXES.some((p) => id.startsWith(p))) return true;
  return false;
}

async function run() {
  console.log("=== cleanup-non-bayarea.ts ===\n");

  const snap = await db.collection("wc2026_fanzones").get();
  const allDocs = snap.docs.map((d) => ({ id: d.id, ref: d.ref, data: d.data() }));

  const nonBayArea = allDocs.filter((d) => !isBayArea(d.id, d.data));
  const bayAreaDocs = allDocs.filter((d) => isBayArea(d.id, d.data));

  // ── LISTADO ──────────────────────────────────────────────────────────────────
  console.log(`Total documentos en colección : ${allDocs.length}`);
  console.log(`Bay Area (se conservan)        : ${bayAreaDocs.length}`);
  console.log(`Fuera del Bay Area (a borrar)  : ${nonBayArea.length}\n`);

  if (nonBayArea.length === 0) {
    console.log("✓ Nada que borrar — la colección ya está limpia.");
    return;
  }

  // Tabla
  const col1 = Math.max(...nonBayArea.map((d) => d.id.length), 14);
  const col2 = Math.max(...nonBayArea.map((d) => (d.data.name as string ?? "").length), 8);
  const col3 = 8;
  const header =
    "ID".padEnd(col1) + "  " +
    "Nombre".padEnd(col2) + "  " +
    "Country".padEnd(col3);
  const sep = "─".repeat(header.length);

  console.log(sep);
  console.log(header);
  console.log(sep);

  // Sort: country, then id
  nonBayArea.sort((a, b) => {
    const ca = (a.data.country as string) ?? "";
    const cb = (b.data.country as string) ?? "";
    if (ca !== cb) return ca.localeCompare(cb);
    return a.id.localeCompare(b.id);
  });

  for (const d of nonBayArea) {
    const name = (d.data.name as string) ?? "(sin nombre)";
    const country = (d.data.country as string) ?? "?";
    console.log(d.id.padEnd(col1) + "  " + name.padEnd(col2) + "  " + country);
  }
  console.log(sep);
  console.log();

  // ── PASO 2 — Borrar champions específicos ──────────────────────────────────
  const championsIds = ["champions-sf-vikings", "champions-mas-bayarea"];
  const championsToDelete = nonBayArea.filter((d) => championsIds.includes(d.id));

  if (championsToDelete.length > 0) {
    console.log(`PASO 2 — Borrando ${championsToDelete.length} documento(s) Champions...`);
    await Promise.all(championsToDelete.map((d) => d.ref.delete()));
    championsToDelete.forEach((d) => console.log(`  ✓ Deleted: ${d.id}`));
    console.log();
  } else {
    console.log("PASO 2 — champions-sf-vikings y champions-mas-bayarea no encontrados (ya borrados o nunca existieron).\n");
  }

  // ── PASO 3 — Borrar todos los demás fuera del Bay Area ──────────────────────
  const remainingToDelete = nonBayArea.filter((d) => !championsIds.includes(d.id));
  console.log(`PASO 3 — Borrando ${remainingToDelete.length} documentos fuera del Bay Area...`);

  // Batch en grupos de 500 (límite Firestore)
  const BATCH_SIZE = 400;
  for (let i = 0; i < remainingToDelete.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = remainingToDelete.slice(i, i + BATCH_SIZE);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    console.log(`  Eliminados ${Math.min(i + BATCH_SIZE, remainingToDelete.length)} / ${remainingToDelete.length}...`);
  }

  // ── VERIFICACIÓN FINAL ───────────────────────────────────────────────────────
  const finalSnap = await db.collection("wc2026_fanzones").get();
  const finalNonBa = finalSnap.docs.filter((d) => !isBayArea(d.id, d.data()));

  console.log();
  console.log("═".repeat(60));
  console.log("VERIFICACIÓN FINAL");
  console.log("═".repeat(60));
  console.log(`Total documentos restantes : ${finalSnap.size}`);
  console.log(`Documentos Bay Area        : ${finalSnap.size - finalNonBa.length}`);
  console.log(`Documentos non-Bay-Area    : ${finalNonBa.length}  ← debe ser 0`);

  if (finalNonBa.length > 0) {
    console.log("\n⚠️  QUEDAN documentos fuera del Bay Area:");
    finalNonBa.forEach((d) => console.log(`  ${d.id}  |  country: ${d.data().country}`));
  } else {
    console.log("\n✅  Colección limpia — solo quedan Fan Zones del Bay Area.");
  }

  // Prefijos champions
  const championsRemaining = finalSnap.docs.filter((d) => d.id.startsWith("champions-"));
  if (championsRemaining.length > 0) {
    console.log("\n⚠️  Todavía existen documentos con prefijo champions-:");
    championsRemaining.forEach((d) => console.log(`  ${d.id}`));
  } else {
    console.log("✅  Cero documentos con prefijo champions-.");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
