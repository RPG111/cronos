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
  await col.doc("ba-pride-house-yerba-buena").set({
    tournament: "world_cup_2026",
    type: "fan_zone",
    name: "Party & Pride House Game Day Watch Party",
    city: "San Francisco",
    country: "bay_area",
    venue: "Yerba Buena Lane",
    address: "Yerba Buena Lane, San Francisco, CA 94103",
    lat: 37.7851,
    lng: -122.4030,
    entry: "Gratis",
    entryType: "walk_in",
    datesOpen: "25 jun 2026",
    officialUrl: "https://www.sfbayareafwc26.com/bay-area-events",
    registrationUrl: null,
    notes: "Jun 25: USA vs Türkiye. Party starts 5pm.",
    food: "Vendors locales",
    alcohol: true,
    amenities: "Pantallas gigantes, ambiente LGBTQ+ friendly",
    active: true,
    status: "active",
  });
  console.log("✓ created: ba-pride-house-yerba-buena");

  await col.doc("ba-sac-republic-block-party").set({
    tournament: "world_cup_2026",
    type: "fan_zone",
    name: "SAC Republic's Soccer Block Party",
    city: "Sacramento",
    country: "bay_area",
    venue: "910 I Street",
    address: "910 I Street, Sacramento, CA 95814",
    lat: 38.5816,
    lng: -121.4944,
    entry: "Gratis",
    entryType: "walk_in",
    datesOpen: "24–25 jun 2026",
    officialUrl: "https://www.sfbayareafwc26.com/bay-area-events",
    registrationUrl: null,
    notes: "Jun 24: México vs Czechia 5pm. Jun 25: USA vs Türkiye 5pm. Presentado por Bank of America.",
    food: "Vendors locales",
    alcohol: true,
    amenities: "Pantallas gigantes, block party al aire libre",
    active: true,
    status: "active",
  });
  console.log("✓ created: ba-sac-republic-block-party");

  console.log("\nAll done.");
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
