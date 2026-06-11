/**
 * translate-fanzones.mjs — Writes English (*En) fields for all wc2026_fanzones docs.
 * Run: node scripts/translate-fanzones.mjs
 *
 * IMPORTANT: When adding a new venue, fill in both the Spanish AND English fields
 * (notesEn, foodEn, amenitiesEn, datesOpenEn, priceEn) so the page stays bilingual.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

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

// ── English translations for all 46 Bay Area fan zone docs ─────────────────
const TRANSLATIONS = {
  "ba-alameda-county-fair": {
    notesEn: "One of the largest Bay Area venues outside SF. Family-friendly with ample space and a fair atmosphere.",
    foodEn: "Fair food vendors",
    amenitiesEn: "Giant screens, large family-friendly space, fair atmosphere",
    datesOpenEn: "Jun 19 – Jul 11, 2026 (Wed–Sun only, 12pm–11pm, free with Fair admission)",
  },
  "ba-berkeley-watch-party": {
    notesEn: "Official watch party for USA vs Paraguay with special appearances.",
    foodEn: "Local vendors",
    amenitiesEn: "Giant screens, special appearances",
    datesOpenEn: "Jun 12, 2026",
  },
  "ba-burlingame": {
    notesEn: "Announced by the Bay Area Host Committee. Dates and venue TBC.",
    datesOpenEn: "TBC",
  },
  "ba-cines-amc": {
    notesEn: "Watch the World Cup on a giant screen with cinema-quality sound. Confirmed locations: AMC Metreon 16 (San Francisco), AMC Bay Street 16 (Emeryville), AMC Eastridge 15 (San Jose), and AMC Mercado 20 (Santa Clara).",
    foodEn: "Cinema concessions (popcorn, nachos, combos)",
    amenitiesEn: "Giant cinema screen, Dolby sound, air conditioning",
    datesOpenEn: "Jun 11 – Jul 19, 2026 (most of group stage and full knockout stage, Telemundo broadcast in Spanish)",
  },
  "ba-cines-cinemark": {
    notesEn: "Selected World Cup matches on the big screen with Telemundo broadcast in Spanish. Check your nearest Cinemark for showtimes and tickets.",
    foodEn: "Cinema concessions",
    amenitiesEn: "Cinema screen, surround sound",
    datesOpenEn: "Selected matches: Mexico vs South Korea (Jun 18), Argentina vs Austria, USA match (Jun 25), third place (Jul 18), and the Final (Jul 19)",
  },
  "ba-cultura-fc-oakland": {
    notesEn: "A soccer, art, and culture celebration co-organized by Oakland Roots and Oakland Soul. One of a kind in the Bay Area.",
    foodEn: "Local food vendors at Jack London Square",
    amenitiesEn: "Art, music, culture, giant screens, unique atmosphere",
    datesOpenEn: "Jun 23–25, 2026",
  },
  "ba-downtown-oakland": {
    amenitiesEn: "Downtown Oakland. Jun 19, 12–3 PM.",
    datesOpenEn: "Jun 19, 2026 (12–3 PM)",
  },
  "ba-east-palo-alto": {
    notesEn: "Community watch party organized for the Latino community of East Palo Alto.",
    foodEn: "Local vendors",
    amenitiesEn: "Giant screens, Latino community event",
    datesOpenEn: "Jun 12, 2026",
  },
  "ba-fan-march-mexico": {
    notesEn: "Official Team Mexico fan march to Thrive City for the Mexico vs South Korea match.",
    amenitiesEn: "Official fan march, pre-match atmosphere",
    datesOpenEn: "Jun 18, 2026",
  },
  "ba-fan-march-usa": {
    notesEn: "Official Team USA fan march from Crane Cove to Thrive City. Departs at 4:30pm.",
    amenitiesEn: "Official fan march, pre-match atmosphere",
    datesOpenEn: "Jun 12, 2026 — 4:30pm",
  },
  "ba-half-moon-bay": {
    notesEn: "Announced by the Bay Area Host Committee. Dates and venue TBC.",
    datesOpenEn: "TBC",
  },
  "ba-jackson-playground-sf": {
    notesEn: "Quarterfinals. Organized by the neighborhood.",
    amenitiesEn: "Outdoor park. Quarterfinals (Jul 11). Community-organized.",
    datesOpenEn: "Jul 11, 2026 (2–7 PM) — Quarterfinals",
  },
  "ba-milpitas": {
    notesEn: "Taste of Milpitas food festival with an included watch party.",
    foodEn: "Taste of Milpitas food festival",
    amenitiesEn: "Food festival + watch party. Jun 20, 3–9 PM.",
    datesOpenEn: "Jun 20, 2026 (3–9 PM)",
  },
  "ba-milpitas-civic": {
    notesEn: "Announced by the Bay Area Host Committee. Dates and venue TBC.",
    datesOpenEn: "TBC",
  },
  "ba-morgan-hill": {
    notesEn: "Matches: Qatar vs Switzerland (12 PM) and Brazil vs Morocco (3 PM).",
    amenitiesEn: "Outdoor Sports Center. Qatar vs Switzerland and Brazil vs Morocco matches. Organized by City of Morgan Hill and OV Toros.",
    datesOpenEn: "Jun 13, 2026 (9 AM – 5 PM)",
  },
  "ba-mountain-view": {
    notesEn: "Announced by the Bay Area Host Committee. Dates and venue TBC.",
    datesOpenEn: "TBC",
  },
  "ba-napa-ruins": {
    notesEn: "Jun 11: Mexico vs South Africa 12pm. Jun 12: USA vs Paraguay 6pm. Jun 19: USA vs Australia 12pm. Jun 25: Turkey vs USA + Paraguay vs Australia. Jun 26–27: various matches. Jul 14–15: Semifinals. Jul 19: Final.",
    foodEn: "TBC",
    amenitiesEn: "Giant screens, unique Napa Valley vibe",
    datesOpenEn: "Jun 11 – Jul 19, 2026 (selected matches: Jun 11, 12, 19, 25, 26, 27; Semis Jul 14–15; Final Jul 19)",
  },
  "ba-oakland-marriott": {
    notesEn: "Watch party for USA vs Paraguay organized by Oakland Sports Group.",
    foodEn: "Hotel menu and vendors",
    amenitiesEn: "Giant screens, hotel atmosphere",
    datesOpenEn: "Jun 12, 2026",
  },
  "ba-pleasant-hill": {
    notesEn: "World Cup opening celebration. Community event for Contra Costa County.",
    foodEn: "Local vendors",
    amenitiesEn: "Giant screens, community atmosphere",
    datesOpenEn: "Jun 11, 2026",
  },
  "ba-pride-house-beaux": {
    notesEn: "Official Pride House SF watch party for the LGBTQ+ community.",
    foodEn: "Bar menu",
    amenitiesEn: "LGBTQ+ friendly atmosphere, giant screens",
    datesOpenEn: "Jun 12, 2026",
  },
  "ba-pride-house-east-cut": {
    notesEn: "Official Pride House SF watch party for USA vs Australia.",
    foodEn: "Local vendors",
    amenitiesEn: "LGBTQ+ friendly atmosphere, giant screens",
    datesOpenEn: "Jun 19, 2026",
  },
  "ba-pride-house-sf": {
    notesEn: "LGBTQ+ space with watch parties and community events throughout the World Cup in San Francisco and associated venues.",
    amenitiesEn: "Inclusive LGBTQ+ space, community watch parties",
    datesOpenEn: "Jun 11 – Jul 19, 2026 (select events throughout the tournament — see calendar)",
  },
  "ba-pride-house-yerba-buena": {
    notesEn: "Jun 25: USA vs Turkey. Party starts 5pm.",
    foodEn: "Local vendors",
    amenitiesEn: "Giant screens, LGBTQ+ friendly atmosphere",
    datesOpenEn: "Jun 25, 2026",
  },
  "ba-redwood-city-courthouse": {
    notesEn: "3 confirmed dates: USA vs South Korea, Mexico vs Czechia, USA vs Turkey.",
    amenitiesEn: "Outdoor plaza in downtown. 3 confirmed matches: USA vs South Korea (Jun 18), Mexico vs Czechia (Jun 24), USA vs Turkey (Jun 25).",
    datesOpenEn: "Jun 23 – Jul 19, 2026 (outdoor watch parties with themed days)",
  },
  "ba-richmond-east-brother": {
    notesEn: "Organized by Richmond United Soccer Club.",
    amenitiesEn: "Brewery with a soccer vibe. 2 dates: Jun 18 and Jun 24. Organized by Richmond United SC.",
    datesOpenEn: "Jun 18 (5–9 PM) and Jun 24 (5:30–9 PM)",
  },
  "ba-richmond-red-oak": {
    notesEn: "Organized by Richmond United Soccer Club.",
    amenitiesEn: "Historic ship with water views. 2 dates: Jun 12 and Jun 25. Organized by Richmond United SC.",
    datesOpenEn: "Jun 12 (5–9 PM) and Jun 25 (7–9 PM)",
  },
  "ba-sac-republic-block-party": {
    notesEn: "Jun 24: Mexico vs Czechia 5pm. Jun 25: USA vs Turkey 5pm. Presented by Bank of America.",
    foodEn: "Local vendors",
    amenitiesEn: "Giant screens, outdoor block party",
    datesOpenEn: "Jun 24–25, 2026",
  },
  "ba-san-carlos-wheeler": {
    notesEn: "Organized by City of San Carlos. Beer and wine available for purchase.",
    amenitiesEn: "Outdoor plaza. Beer and wine for purchase. 2 dates: USA vs Paraguay (Jun 12) and the Final (Jul 19).",
    datesOpenEn: "Jun 12 (6–8:30 PM) and Final Jul 19 (12–7 PM)",
  },
  "ba-san-mateo-central-park": {
    notesEn: "USA vs Turkey confirmed Jun 25. More matches to be announced.",
    amenitiesEn: "Outdoor park. Giant screen. USA vs Turkey (Jun 25). More dates TBC.",
    datesOpenEn: "Jun 25, 2026 (6:45 PM – match at 7 PM) + more dates TBC",
  },
  "ba-santa-cruz-boardwalk": {
    notesEn: "USA vs Turkey confirmed Jun 25. Giant LED screen in the arena.",
    foodEn: "Boardwalk food options",
    amenitiesEn: "Giant LED screen. Beer garden in front of the Colonnade. Ocean views. USA vs Turkey (Jun 25).",
    datesOpenEn: "Jun 25, 2026 (7–9:30 PM) + more dates",
  },
  "ba-santa-cruz-mah": {
    notesEn: "Announced by the Bay Area Host Committee. Dates and venue TBC.",
    datesOpenEn: "TBC",
  },
  "ba-santa-rosa": {
    notesEn: "Announced by the Bay Area Host Committee. Dates and venue TBC.",
    datesOpenEn: "TBC",
  },
  "ba-santana-row": {
    notesEn: "Watch parties at 15+ restaurants. FIFA Pop-Up Shop Jun 10 – Jul 19.",
    foodEn: "15+ restaurants: Augustine, Left Bank, Dumpling Time, EMC Seafood, El Jardin, Momosan and more",
    amenitiesEn: "FIFA Pop-Up Shop. Live DJs. Happy hours at Vintage Wine Bar. 15+ participating restaurants. Full 5 weeks.",
    datesOpenEn: "Jun 11 – Jul 19, 2026 (5 weeks)",
  },
  "ba-sausalito": {
    notesEn: "Announced by the Bay Area Host Committee. Dates and venue TBC.",
    datesOpenEn: "TBC",
  },
  "ba-sf-pride-block-party": {
    notesEn: "Coincides with SF Pride. Official watch party with block party included.",
    foodEn: "Pride event vendors",
    amenitiesEn: "Block party, Pride atmosphere, giant screens",
    datesOpenEn: "Jun 25, 2026",
  },
  "ba-spark-social-sf": {
    foodEn: "Variety of local food vendors",
    amenitiesEn: "Outdoor giant screen. Beer garden. Community atmosphere. Walk-in, no registration required.",
    datesOpenEn: "Jun 11 – Jul 19, 2026",
  },
  "ba-sunnyvale": {
    notesEn: "Announced by the Bay Area Host Committee. Dates and venue TBC.",
    datesOpenEn: "TBC",
  },
  "ba-treasure-island-gold-bar": {
    notesEn: "Waterfront views. Matches: USA vs Australia, Brazil vs Haiti, Germany vs Ivory Coast, Ecuador vs Germany, Japan vs Sweden, Turkey vs USA, Norway vs France, Uruguay vs Spain, Panama vs England, Colombia vs Portugal, Jordan vs Argentina.",
    foodEn: "Local food options at the venue",
    amenitiesEn: "Giant screen with Bay views. Waterfront. Beer garden. 13 confirmed matches Jun 19–27.",
    datesOpenEn: "Jun 19 – Jun 27, 2026 (13 confirmed matches)",
  },
  "ba-usa-australia-oakland": {
    notesEn: "Official watch party for USA vs Australia. Exact venue TBC.",
    foodEn: "TBC",
    amenitiesEn: "Giant screens",
    datesOpenEn: "Jun 19, 2026",
  },
  "ba-walnut-creek-lesher": {
    notesEn: "Limited capacity of 785 seats. Matches: Qatar vs Switzerland 12 PM, Brazil vs Morocco 3 PM.",
    amenitiesEn: "Air-conditioned theater with 785 seats. Giant screen. Book in advance — limited capacity.",
    datesOpenEn: "Jun 13, 2026 (12–7 PM)",
  },
  "champions-splash-thrive": {
    foodEn: "Full sports bar menu in a 30,000 sq ft venue",
    amenitiesEn: "1,400 sq ft mega-screen + additional screens. DJ pre and post-match. Soccer simulators, foosball, shuffleboard. Trophy photo op. Free with RSVP.",
  },
  "fan-zone-san-pedro-square-sj": {
    notesEn: "Main Bay Area hub. Additional venues TBC.",
    foodEn: "Themed menus by participating country",
    amenitiesEn: "2 giant screens. Pre-match and halftime DJ. Face painting, games, giveaways, family Soccer Village. Meet & greets with legends. VIP Zone for Season Ticket Holders. 39 full days. Free with RSVP.",
    datesOpenEn: "Jun 11 – Jul 19, 2026 (all 104 matches, continuous broadcast, free with RSVP)",
  },
  "fan-zone-thrive-city-sf": {
    foodEn: "Local vendors in an outdoor plaza",
    amenitiesEn: "Outdoor giant screen. Activations by Kaiser Permanente, Genentech and PG&E. Only 2 dates: Jun 12 (USA vs Paraguay) and Jun 18 (Mexico vs South Korea). Free with RSVP.",
    datesOpenEn: "Jun 18, 2026 (Mexico vs South Korea)",
  },
  "oak-raimondi-park": {
    notesEn: "Organized by Bay Area Host Committee.",
    foodEn: "Food vendors at the adjacent Prescott Marketplace",
    amenitiesEn: "Large screens. Organized by Oakland Roots SC and Oakland Ballers. Only 1 confirmed date: Jun 12, 5–9pm (USA vs Paraguay). RSVP via TicketLeap. Free.",
    datesOpenEn: "Jun 12, 2026 (5–9 PM, USA vs Paraguay)",
  },
  "sf-china-basin": {
    notesEn: "Organized by Bay Area Host Committee.",
    foodEn: "Adjacent Mission Rock restaurants",
    amenitiesEn: "Large screens. Great Lawn, views of McCovey Cove, Bay Trail. Pet-friendly. Selected match days only; special events at Semis (Jul 14) and Final (Jul 19). Free.",
    datesOpenEn: "Jun 13 – Jul 19, 2026 (selected match dates)",
  },
  "sf-pier39": {
    notesEn: "Organized by Bay Area Host Committee.",
    foodEn: "Pier restaurants and food stalls",
    amenitiesEn: "Beer garden. Screens for selected matches. Sea lions, family attractions. USA matches only, Round of 16, Quarterfinals, Semifinals and Final. Free.",
    datesOpenEn: "Jun 12 – Jul 19, 2026 (select dates: USA Jun 12, 19, 25; Round of 16 Jul 5–7; Quarters Jul 9–11; Semis Jul 14–15; Final Jul 19)",
  },
};

// ── Run ────────────────────────────────────────────────────────────────────────
async function run() {
  console.log("=== translate-fanzones.mjs — writing *En fields ===\n");

  const snap = await db.collection("wc2026_fanzones").get();
  console.log(`Total docs in collection: ${snap.size}\n`);

  let updated = 0;
  let skipped = 0;

  for (const d of snap.docs) {
    const tr = TRANSLATIONS[d.id];
    if (!tr) {
      console.log(`  ⚠  no translation entry for: ${d.id}`);
      skipped++;
      continue;
    }
    await d.ref.set(tr, { merge: true });
    console.log(`  ✓  ${d.id}`);
    updated++;
  }

  console.log(`\n── Summary ──`);
  console.log(`  Updated : ${updated}`);
  console.log(`  Skipped : ${skipped}`);

  // ── Verification: count docs that now have *En fields ──────────────────────
  const snap2 = await db.collection("wc2026_fanzones").get();
  let withEn = 0;
  for (const d of snap2.docs) {
    const v = d.data();
    if (v.notesEn || v.foodEn || v.amenitiesEn || v.datesOpenEn) withEn++;
  }
  console.log(`\n  Docs with *En fields: ${withEn} / ${snap2.size}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
