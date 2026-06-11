/**
 * seed-jun09.mjs — Agrega 3 venues nuevos al Bay Area (9 jun 2026)
 * Ejecución: node scripts/seed-jun09.mjs
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
const now = admin.firestore.FieldValue.serverTimestamp();

// ── Venues nuevos ─────────────────────────────────────────────────────────────
// BILINGUAL RULE: every new venue MUST include both Spanish and English field variants:
//   notesEn, foodEn, amenitiesEn, datesOpenEn (and priceEn if price is set).
// After adding a venue, run: node scripts/translate-fanzones.mjs (add the entry there too).
const venues = [
  {
    id: "ba-cines-amc",
    data: {
      tournament: "world_cup_2026",
      type: "fan_zone",
      name: "Mundial en AMC Theatres",
      city: "SF, Emeryville, San Jose, Santa Clara",
      country: "bay_area",
      // Sede principal: AMC Metreon 16, SF
      venue: "AMC Theatres (Metreon 16 · Bay Street 16 · Eastridge 15 · Mercado 20)",
      address: "135 4th St, San Francisco, CA 94103 (y otras ubicaciones)",
      lat: 37.7845,
      lng: -122.4027,
      entryType: "paid",
      entry: "$18 por boleto",
      datesOpen: "11 jun – 19 jul 2026 (casi toda la fase de grupos y toda la fase eliminatoria, transmisión Telemundo en español)",
      registrationUrl: "https://www.amctheatres.com/events/fifa-world-cup",
      officialUrl: "https://www.amctheatres.com/events/fifa-world-cup",
      notes: "Vive el Mundial en pantalla gigante con audio de cine. Ubicaciones confirmadas: AMC Metreon 16 (San Francisco), AMC Bay Street 16 (Emeryville), AMC Eastridge 15 (San Jose) y AMC Mercado 20 (Santa Clara).",
      food: "Concesiones de cine (palomitas, nachos, combos)",
      alcohol: false,
      amenities: "Pantalla gigante de cine, sonido Dolby, aire acondicionado",
      active: true,
      status: "active",
      updatedAt: now,
    },
  },
  {
    id: "ba-cines-cinemark",
    data: {
      tournament: "world_cup_2026",
      type: "fan_zone",
      name: "Mundial en Cinemark",
      city: "Bay Area (múltiples ubicaciones)",
      country: "bay_area",
      venue: "Cinemark (múltiples ubicaciones Bay Area)",
      address: "Multiple Bay Area locations — consulta cinemark.com",
      lat: 37.5630,
      lng: -122.0530,
      entryType: "paid",
      entry: "$23 por boleto",
      datesOpen: "Partidos selectos: México vs Corea (18 jun), Argentina vs Austria, partido de USA (25 jun), tercer lugar (18 jul) y la Final (19 jul)",
      registrationUrl: "https://www.cinemark.com",
      officialUrl: "https://www.cinemark.com",
      notes: "Partidos selectos del Mundial en pantalla de cine con transmisión Telemundo en español. Consulta tu Cinemark más cercano para horarios y boletos.",
      food: "Concesiones de cine",
      alcohol: false,
      amenities: "Pantalla de cine, sonido surround",
      active: true,
      status: "active",
      updatedAt: now,
    },
  },
  {
    id: "ba-pride-house-sf",
    data: {
      tournament: "world_cup_2026",
      type: "fan_zone",
      name: "Pride House SF",
      city: "San Francisco",
      country: "bay_area",
      venue: "Pride House SF y venues asociados",
      address: "San Francisco, CA (ver calendario en sitio oficial)",
      lat: 37.7749,
      lng: -122.4194,
      entryType: "walk_in",
      entry: "Gratis",
      datesOpen: "11 jun – 19 jul 2026 (eventos selectos durante todo el torneo — ver calendario)",
      registrationUrl: "https://pridehouseunited2026.com/san-francisco",
      officialUrl: "https://pridehouseunited2026.com/san-francisco",
      notes: "Espacio LGBTQ+ con watch parties y eventos comunitarios durante todo el Mundial en San Francisco y venues asociados.",
      food: null,
      alcohol: null,
      amenities: "Espacio inclusivo LGBTQ+, watch parties comunitarias",
      active: true,
      status: "active",
      updatedAt: now,
    },
  },
];

// ── Seed ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log("=== seed-jun09.mjs — 3 venues nuevos ===\n");

  for (const { id, data } of venues) {
    const ref = db.collection("wc2026_fanzones").doc(id);
    const existing = await ref.get();
    if (existing.exists) {
      console.log(`⚠️  Ya existe: ${id} — actualizando con merge...`);
      await ref.set(data, { merge: true });
    } else {
      await ref.set(data);
    }
    console.log(`✓ ${id}  →  ${data.name}`);
  }

  // Verificación
  const snap = await db.collection("wc2026_fanzones").get();
  const byCountry = {};
  snap.docs.forEach((d) => {
    const c = d.data().country ?? "(sin country)";
    byCountry[c] = (byCountry[c] ?? 0) + 1;
  });

  console.log("\n── Verificación final ──");
  console.log(`Total documentos: ${snap.size}`);
  for (const [c, n] of Object.entries(byCountry).sort()) {
    console.log(`  ${c.padEnd(22)}: ${n}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
