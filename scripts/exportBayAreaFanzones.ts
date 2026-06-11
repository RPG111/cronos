import { readFileSync } from "fs";
import { resolve } from "path";
import admin from "firebase-admin";

// Load .env.local manually
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
  console.error("Could not read .env.local — make sure it exists.");
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

// ── helpers ────────────────────────────────────────────────────────────────

function parseDuration(datesOpen: unknown): number {
  if (!datesOpen) return 0;
  const raw = String(datesOpen).toLowerCase().trim();

  // Range like "11 jun – 19 jul 2026" or "11 jun - 19 jul 2026"
  const rangeMatch = raw.match(
    /(\d{1,2})\s+(\w+)(?:\s+\d{4})?\s*[–\-]\s*(\d{1,2})\s+(\w+)(?:\s+(\d{4}))?/
  );
  if (rangeMatch) {
    const months: Record<string, number> = {
      ene: 0, jan: 0, feb: 1, mar: 2, abr: 3, apr: 3,
      may: 4, jun: 5, jul: 6, ago: 7, aug: 7, sep: 8,
      oct: 9, nov: 10, dic: 11, dec: 11,
    };
    const year = parseInt(rangeMatch[5] ?? "2026");
    const d1 = new Date(year, months[rangeMatch[2].slice(0, 3)] ?? 5, parseInt(rangeMatch[1]));
    const d2 = new Date(year, months[rangeMatch[4].slice(0, 3)] ?? 6, parseInt(rangeMatch[3]));
    const diff = Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1;
    return diff > 0 ? diff : 1;
  }

  // Multiple dates separated by commas / semicolons → count unique dates
  const commaMatch = raw.match(/\d{1,2}\s+\w+/g);
  if (commaMatch && commaMatch.length > 1) return commaMatch.length;

  // Single date
  return 1;
}

function truncate(s: unknown, max = 45): string {
  if (s === undefined || s === null) return "—";
  const str = String(s);
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function boolLabel(v: unknown): string {
  if (v === true || v === "true" || v === "Sí" || v === "si" || v === "yes") return "✓";
  if (v === false || v === "false" || v === "No" || v === "no") return "✗";
  if (v === undefined || v === null || v === "") return "—";
  return truncate(v, 30);
}

function entryBadge(t: unknown): string {
  switch (t) {
    case "walk_in": return "🟢 walk_in";
    case "registration_required": return "🟡 registration";
    case "paid": return "🔴 paid";
    default: return t ? String(t) : "—";
  }
}

// ── main ───────────────────────────────────────────────────────────────────

async function run() {
  const snap = await db
    .collection("wc2026_fanzones")
    .where("country", "==", "bay_area")
    .get();

  if (snap.empty) {
    // Fallback: fetch all and filter client-side in case field name differs
    console.log('No docs with country=="bay_area". Trying broader query…');
    const all = await db.collection("wc2026_fanzones").get();
    const candidates = all.docs.filter((d) => {
      const data = d.data();
      const fields = [data.country, data.region, data.area, data.city, data.venue, data.address];
      return fields.some((f) =>
        typeof f === "string" &&
        (f.toLowerCase().includes("bay area") ||
          f.toLowerCase().includes("bay_area") ||
          f === "San Francisco" ||
          f === "Oakland" ||
          f === "San Jose" ||
          f === "Sacramento")
      );
    });
    if (!candidates.length) {
      console.log("No Bay Area venues found. All distinct country values:");
      const vals = new Set(all.docs.map((d) => d.data().country));
      console.log([...vals].sort().join(", "));
      process.exit(0);
    }
    processAndPrint(candidates.map((d) => ({ id: d.id, ...d.data() })));
    return;
  }

  processAndPrint(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

function processAndPrint(raw: Record<string, unknown>[]) {
  // Attach duration and sort descending
  const venues = raw
    .map((v) => ({ ...v, _days: parseDuration(v.datesOpen ?? v.dates ?? v.datesOpens) }))
    .sort((a, b) => (b._days as number) - (a._days as number));

  console.log(`\n${"═".repeat(120)}`);
  console.log(`  BAY AREA FAN ZONES — World Cup 2026   (${venues.length} venues, sorted by days open)`);
  console.log(`${"═".repeat(120)}\n`);

  for (const v of venues) {
    const days = v._days as number;
    const dayLabel = days === 1 ? "1 day " : `${days} days`;
    const line = `─────────────────────────────────────────────────────────────────────────────────────────────────`;
    console.log(line);
    console.log(
      `  📍 ${String(v.name ?? v.venue ?? "Unknown")}` +
        `   [${dayLabel}]   ${entryBadge(v.entryType)}   status: ${v.status ?? "—"}`
    );
    console.log(`     City: ${v.city ?? "—"}   |   Venue: ${truncate(v.venue, 50)}`);
    console.log(`     Dates: ${v.datesOpen ?? v.dates ?? v.datesOpens ?? "—"}`);
    console.log(
      `     Entry: ${v.entry ?? v.price ?? "—"}` +
        (v.entryType === "paid" && v.price ? `  (${v.price})` : "")
    );
    console.log(`     Food: ${boolLabel(v.food)}   Alcohol: ${boolLabel(v.alcohol)}`);

    const amenities = v.amenities;
    if (amenities) {
      if (Array.isArray(amenities)) {
        console.log(`     Amenities: ${amenities.join(", ")}`);
      } else {
        console.log(`     Amenities: ${String(amenities)}`);
      }
    } else {
      console.log(`     Amenities: —`);
    }

    // Extra descriptive fields
    const extras: string[] = [];
    if (v.description) extras.push(`Description: ${truncate(v.description, 80)}`);
    if (v.views) extras.push(`Views: ${truncate(v.views, 60)}`);
    if (v.atmosphere) extras.push(`Atmosphere: ${truncate(v.atmosphere, 60)}`);
    if (v.notes) extras.push(`Notes: ${truncate(v.notes, 80)}`);
    if (extras.length) console.log(`     ${extras.join("   |   ")}`);

    console.log();
  }

  console.log(`${"═".repeat(120)}`);
  console.log(`\n  SUMMARY`);
  console.log(`  ─────────────────────────────────────────────────────`);

  const full = venues.filter((v) => (v._days as number) >= 30);
  const multi = venues.filter((v) => (v._days as number) >= 14 && (v._days as number) < 30);
  const short = venues.filter((v) => (v._days as number) > 1 && (v._days as number) < 14);
  const oneDay = venues.filter((v) => (v._days as number) === 1);

  const free = venues.filter((v) => v.entryType === "walk_in");
  const reg = venues.filter((v) => v.entryType === "registration_required");
  const paid = venues.filter((v) => v.entryType === "paid");

  console.log(`  Full tournament (30+ days): ${full.length} — ${full.map((v) => v.name ?? v.venue).join(", ") || "none"}`);
  console.log(`  2+ weeks (14-29 days):      ${multi.length} — ${multi.map((v) => v.name ?? v.venue).join(", ") || "none"}`);
  console.log(`  Short run (2-13 days):      ${short.length} — ${short.map((v) => v.name ?? v.venue).join(", ") || "none"}`);
  console.log(`  Single day:                 ${oneDay.length} — ${oneDay.map((v) => v.name ?? v.venue).join(", ") || "none"}`);
  console.log();
  console.log(`  🟢 walk_in (free):          ${free.length}`);
  console.log(`  🟡 registration_required:   ${reg.length}`);
  console.log(`  🔴 paid:                    ${paid.length}`);
  console.log(`${"═".repeat(120)}\n`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
