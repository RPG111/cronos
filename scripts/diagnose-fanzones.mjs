// Diagnostic script — READ ONLY, no deletes
import { readFileSync } from "fs";
import { resolve } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Load .env.local
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

async function diagnose() {
  console.log("=== DIAGNÓSTICO wc2026_fanzones (READ ONLY) ===\n");

  const snap = await db.collection("wc2026_fanzones").get();
  const docs = snap.docs.map((d) => ({ id: d.id, data: d.data() }));

  const countByCountry = {};
  for (const d of docs) {
    const c = d.data.country ?? "(sin country)";
    countByCountry[c] = (countByCountry[c] ?? 0) + 1;
  }

  console.log(`TOTAL documentos en Firestore: ${docs.length}\n`);
  console.log("Por country:");
  for (const [country, count] of Object.entries(countByCountry).sort()) {
    console.log(`  ${country.padEnd(20)} : ${count}`);
  }

  const BAY_AREA_ID_PREFIXES = ["ba-", "sf-", "oak-", "fan-zone-"];
  const bayArea = docs.filter(
    (d) =>
      d.data.country === "bay_area" ||
      BAY_AREA_ID_PREFIXES.some((p) => d.id.startsWith(p))
  );
  const nonBayArea = docs.filter(
    (d) =>
      d.data.country !== "bay_area" &&
      !BAY_AREA_ID_PREFIXES.some((p) => d.id.startsWith(p))
  );

  console.log(`\nBay Area (conservar): ${bayArea.length}`);
  console.log(`Fuera Bay Area (a borrar): ${nonBayArea.length}`);

  if (nonBayArea.length > 0) {
    console.log("\nPrimeros 10 no-Bay-Area:");
    nonBayArea.slice(0, 10).forEach((d) =>
      console.log(`  [${d.data.country ?? "?"}] ${d.id} — ${d.data.name ?? "(sin nombre)"}`)
    );
    if (nonBayArea.length > 10) console.log(`  ... y ${nonBayArea.length - 10} más`);
  }
}

diagnose().catch((err) => {
  console.error(err);
  process.exit(1);
});
