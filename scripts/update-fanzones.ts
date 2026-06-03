import admin from "firebase-admin";

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
const col = db.collection("wc2026_fanzones");

async function run() {
  const updates: Array<{ id: string; data: Record<string, unknown> }> = [
    {
      id: "fan-zone-thrive-city-sf",
      data: {
        datesOpen: "Jun 11 – Jul 19 2026 (partidos seleccionados)",
        registrationUrl: "https://www.eventbrite.com/e/soccer-viewing-tickets-1986850361917",
        entryType: "registration_required",
        notes:
          "Jun 11: México vs Sudáfrica 12pm–3pm. Jun 12: USA vs Paraguay (Watch Party oficial). Jun 18: México vs Corea del Sur en español por Telemundo. First-come first-served. RSVP en Eventbrite por partido.",
      },
    },
    {
      id: "ba-spark-social-sf",
      data: {
        datesOpen: "Jun 11 – Jul 19 2026 (todos los partidos)",
        registrationUrl: null,
        entryType: "walk_in",
        officialUrl: "https://sparksocialsf.com/world-cup-watch-parties/",
        notes: "Walk-in, no requiere registro. Transmite todos los partidos del torneo. Beer garden, food trucks.",
      },
    },
    {
      id: "fan-zone-san-pedro-square-sj",
      data: {
        datesOpen:
          "Jun 11–14 Opening Weekend, luego Jun 15 – Jul 19 2026 (todos los 104 partidos)",
        registrationUrl:
          "https://www.sfbayareafwc26.com/bay-area-events/san-jose-earthquakes-celebration-of-soccer-opening-weekend-presented-by-bahc-and-sj26",
        entryType: "registration_required",
        officialUrl: "https://sjearthquakes.com/soccercelebration",
        notes:
          "Transmite todos los 104 partidos. Opening Weekend Jun 11-14 presentado por BAHC y SJ26. RSVP requerido. Se puede beber en áreas designadas al aire libre.",
      },
    },
    {
      id: "ba-santana-row",
      data: {
        datesOpen: "Jun 11 – Jul 19 2026",
        registrationUrl: null,
        entryType: "walk_in",
        officialUrl: "https://santanarow.com/event/the-row-cup/",
        notes:
          "Walk-in, no requiere registro. 15+ restaurantes con menús temáticos, cócteles especiales, DJ y FIFA Pop-Up Shop.",
      },
    },
  ];

  for (const { id, data } of updates) {
    await col.doc(id).set(data, { merge: true });
    console.log(`✓ updated: ${id}`);
  }

  // New document
  await col.doc("ba-napa-ruins").set({
    tournament: "world_cup_2026",
    type: "fan_zone",
    name: "Watch Party at The Ruins — Napa Valley",
    city: "American Canyon",
    country: "bay_area",
    venue: "The Ruins",
    address: "100 Ruins Court, American Canyon, CA 94503",
    lat: 38.1804,
    lng: -122.2483,
    entry: "Gratis",
    entryType: "walk_in",
    datesOpen: "Jun 11 – Jul 19 2026 (partidos seleccionados)",
    officialUrl: "https://www.sfbayareafwc26.com/bay-area-events/watch-party-at-the-napa-ruins",
    registrationUrl: null,
    notes:
      "Jun 11: México vs Sudáfrica 12pm. Jun 12: USA vs Paraguay 6pm. Jun 19: USA vs Australia 12pm. Jun 25: Türkiye vs USA + Paraguay vs Australia. Jun 26-27: varios partidos. Jul 14-15: Semifinales. Jul 19: Final.",
    food: "Por confirmar",
    alcohol: true,
    amenities: "Pantallas gigantes, ambiente único en Napa Valley",
    active: true,
    status: "active",
  });
  console.log("✓ created: ba-napa-ruins");

  console.log("\nAll done.");
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
