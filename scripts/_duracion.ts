import { readFileSync } from "fs";
import { resolve } from "path";
import admin from "firebase-admin";

const envPath = resolve(process.cwd(), ".env.local");
const raw = readFileSync(envPath, "utf-8");
for (const line of raw.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim().replace(/^"+|"+$/g, "");
  if (!process.env[key]) process.env[key] = val;
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

const MONTHS: Record<string, number> = {
  ene: 0, jan: 0, feb: 1, mar: 2, abr: 3, apr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, aug: 7, sep: 8, oct: 9, nov: 10, dic: 11, dec: 11,
};

function calcDays(datesOpen: unknown): number {
  if (!datesOpen) return 0;
  const lo = String(datesOpen).toLowerCase().trim();

  // "11 jun – 19 jul 2026"
  const r1 = lo.match(/(\d{1,2})\s+(\w{3,})\s*(?:\d{4})?\s*[–\-—]+\s*(\d{1,2})\s+(\w{3,})\s*(?:(\d{4}))?/);
  if (r1) {
    const yr = parseInt(r1[5] ?? "2026");
    const m1 = MONTHS[r1[2].slice(0, 3)];
    const m2 = MONTHS[r1[4].slice(0, 3)];
    if (m1 !== undefined && m2 !== undefined) {
      const diff = Math.round(
        (new Date(yr, m2, parseInt(r1[3])).getTime() -
          new Date(yr, m1, parseInt(r1[1])).getTime()) / 86400000
      ) + 1;
      return diff > 0 ? diff : 1;
    }
  }

  // "Jun 11 – Jul 19 2026"
  const r2 = lo.match(/(\w{3,})\s+(\d{1,2})\s*(?:\d{4})?\s*[–\-—]+\s*(\w{3,})\s+(\d{1,2})\s*(?:(\d{4}))?/);
  if (r2) {
    const yr = parseInt(r2[5] ?? "2026");
    const m1 = MONTHS[r2[1].slice(0, 3)];
    const m2 = MONTHS[r2[3].slice(0, 3)];
    if (m1 !== undefined && m2 !== undefined) {
      const diff = Math.round(
        (new Date(yr, m2, parseInt(r2[4])).getTime() -
          new Date(yr, m1, parseInt(r2[2])).getTime()) / 86400000
      ) + 1;
      return diff > 0 ? diff : 1;
    }
  }

  // Multiple explicit dates: "12 jun, 18 jun, 25 jun"
  const dates = lo.match(/\d{1,2}\s+(?:ene|jan|feb|mar|abr|apr|may|jun|jul|ago|aug|sep|oct|nov|dic|dec)/g);
  if (dates && dates.length > 1) return dates.length;

  return 1;
}

async function run() {
  const db = admin.firestore();
  const snap = await db.collection("wc2026_fanzones").where("country", "==", "bay_area").get();

  const venues = snap.docs
    .map((d) => {
      const v = d.data();
      return {
        name: (v.name ?? v.venue ?? d.id) as string,
        city: (v.city ?? "—") as string,
        days: calcDays(v.datesOpen ?? v.dates),
        datesOpen: (v.datesOpen ?? v.dates ?? "—") as string,
        entryType: (v.entryType ?? "—") as string,
      };
    })
    .sort((a, b) => b.days - a.days || a.name.localeCompare(b.name));

  const badge = (t: string) =>
    t === "walk_in" ? "🟢" : t === "registration_required" ? "🟡" : t === "paid" ? "🔴" : "⚪";

  const W_NAME = 48;
  const W_CITY = 16;
  const W_DATE = 38;

  console.log("\n" + "=".repeat(100));
  console.log(`  BAY AREA FAN ZONES — ${venues.length} venues  (ordenados por duración)`);
  console.log("=".repeat(100));
  console.log(
    `  ${"#".padEnd(3)} ${"Días".padEnd(5)} ${"T".padEnd(3)} ${"Ciudad".padEnd(W_CITY)} ${"Nombre".padEnd(W_NAME)} Fechas`
  );
  console.log("  " + "─".repeat(96));

  for (const [i, v] of venues.entries()) {
    const daysStr = v.days > 0 ? String(v.days) : "?";
    const nameCol = v.name.length > W_NAME ? v.name.slice(0, W_NAME - 1) + "…" : v.name.padEnd(W_NAME);
    const cityCol = v.city.length > W_CITY ? v.city.slice(0, W_CITY - 1) + "…" : v.city.padEnd(W_CITY);
    const dateStr = v.datesOpen.length > W_DATE ? v.datesOpen.slice(0, W_DATE - 1) + "…" : v.datesOpen;
    console.log(
      `  ${String(i + 1).padEnd(3)} ${daysStr.padEnd(5)} ${badge(v.entryType).padEnd(3)} ${cityCol} ${nameCol} ${dateStr}`
    );
  }

  console.log("=".repeat(100));
  console.log("\n  TOTALES POR DURACIÓN:");
  const buckets = [
    { label: "Torneo completo  (39 días)", fn: (d: number) => d === 39 },
    { label: "30–38 días               ", fn: (d: number) => d >= 30 && d < 39 },
    { label: "14–29 días               ", fn: (d: number) => d >= 14 && d < 30 },
    { label: "7–13 días                ", fn: (d: number) => d >= 7 && d < 14 },
    { label: "2–6 días                 ", fn: (d: number) => d >= 2 && d < 7 },
    { label: "1 día                    ", fn: (d: number) => d === 1 },
    { label: "Sin fecha                ", fn: (d: number) => d === 0 },
  ];
  for (const b of buckets) {
    const group = venues.filter((v) => b.fn(v.days));
    if (group.length) console.log(`    ${b.label}: ${group.length}  → ${group.map((v) => v.name).join(", ")}`);
  }
  console.log("\n  🟢 walk_in: " + venues.filter((v) => v.entryType === "walk_in").length +
    "   🟡 registration: " + venues.filter((v) => v.entryType === "registration_required").length +
    "   🔴 paid: " + venues.filter((v) => v.entryType === "paid").length);
  console.log("=".repeat(100) + "\n");
}

run().catch((e) => { console.error(e); process.exit(1); });
