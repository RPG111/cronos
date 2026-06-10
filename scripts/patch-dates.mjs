/**
 * patch-dates.mjs — Agrega startDate / endDate a todos los venues
 *
 * node scripts/patch-dates.mjs           ← solo muestra tabla (DRY RUN)
 * node scripts/patch-dates.mjs --write   ← escribe en Firestore
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const WRITE = process.argv.includes("--write");

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

// ── Date parsing ──────────────────────────────────────────────────────────────
const MONTHS = {
  ene: "01", feb: "02", mar: "03", abr: "04", may: "05", jun: "06",
  jul: "07", ago: "08", sep: "09", oct: "10", nov: "11", dic: "12",
};

function toISO(day, mon, year = "2026") {
  return `${year}-${MONTHS[mon.toLowerCase()]}-${String(day).padStart(2, "0")}`;
}

function parseDates(datesOpen, status) {
  // coming_soon o sin fecha → null
  if (!datesOpen || datesOpen === "Por confirmar") return { startDate: null, endDate: null };
  if (status === "coming_soon") return { startDate: null, endDate: null };

  const d = datesOpen;

  // ── Patrón "DD–DD mon YYYY" — rango mismo mes (ej. "23–25 jun 2026") ──────
  const sameMonth = d.match(
    /(\d{1,2})[–\-](\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\s+(\d{4})/i
  );
  if (sameMonth) {
    const [, d1, d2, mon, yr] = sameMonth;
    return { startDate: toISO(d1, mon, yr), endDate: toISO(d2, mon, yr) };
  }

  // ── Extrae todos los "DD mon [YYYY]" del texto ────────────────────────────
  // Cubre: "11 jun", "19 jul 2026", fechas en listas separadas por comas/y
  const pattern = /\b(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)(?:\s+(\d{4}))?/gi;
  const found = [];
  let m;
  while ((m = pattern.exec(d)) !== null) {
    found.push(toISO(m[1], m[2], m[3] ?? "2026"));
  }

  if (!found.length) return { startDate: null, endDate: null };

  found.sort();
  return { startDate: found[0], endDate: found[found.length - 1] };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  const mode = WRITE ? "✍️  WRITE" : "🔍  DRY RUN (sin escritura)";
  console.log(`\n=== patch-dates.mjs | ${mode} ===\n`);

  const snap = await db.collection("wc2026_fanzones").orderBy("__name__").get();
  const rows = snap.docs.map((doc) => {
    const data = doc.data();
    const { startDate, endDate } = parseDates(data.datesOpen, data.status);
    return { id: doc.id, ref: doc.ref, datesOpen: data.datesOpen ?? "(sin campo)", startDate, endDate };
  });

  // ── Tabla ─────────────────────────────────────────────────────────────────
  const c1 = Math.max(...rows.map((r) => r.id.length), 2);
  const c2 = Math.max(...rows.map((r) => (r.startDate ?? "null").length), 9);
  const c3 = Math.max(...rows.map((r) => (r.endDate ?? "null").length), 7);
  const c4 = 52; // datesOpen truncated

  const hdr = "ID".padEnd(c1) + "  " + "startDate".padEnd(c2) + "  " + "endDate".padEnd(c3) + "  datesOpen (preview)";
  const sep = "─".repeat(hdr.length);

  console.log(sep);
  console.log(hdr);
  console.log(sep);

  for (const r of rows) {
    const start = (r.startDate ?? "null").padEnd(c2);
    const end   = (r.endDate   ?? "null").padEnd(c3);
    const preview = r.datesOpen.length > c4 ? r.datesOpen.slice(0, c4 - 1) + "…" : r.datesOpen;
    console.log(`${r.id.padEnd(c1)}  ${start}  ${end}  ${preview}`);
  }
  console.log(sep);
  console.log(`\nTotal: ${rows.length} venues`);

  const nullCount  = rows.filter((r) => r.startDate === null).length;
  const rangeCount = rows.filter((r) => r.startDate !== null && r.startDate !== r.endDate).length;
  const singleCount = rows.filter((r) => r.startDate !== null && r.startDate === r.endDate).length;
  console.log(`  null (coming_soon o sin fecha) : ${nullCount}`);
  console.log(`  rango (start ≠ end)            : ${rangeCount}`);
  console.log(`  día único (start = end)        : ${singleCount}`);

  if (!WRITE) {
    console.log("\n──────────────────────────────────────────────────");
    console.log("DRY RUN completado. Para escribir en Firestore:");
    console.log("  node scripts/patch-dates.mjs --write");
    console.log("──────────────────────────────────────────────────\n");
    return;
  }

  // ── Escritura ─────────────────────────────────────────────────────────────
  console.log("\nEscribiendo en Firestore...");
  const BATCH_SIZE = 400;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = db.batch();
    rows.slice(i, i + BATCH_SIZE).forEach(({ ref, startDate, endDate }) => {
      batch.set(ref, { startDate: startDate ?? null, endDate: endDate ?? null }, { merge: true });
    });
    await batch.commit();
    console.log(`  Patch ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length}`);
  }
  console.log("✅ Campos startDate/endDate escritos en los 48 venues.");
}

run().catch((err) => { console.error(err); process.exit(1); });
