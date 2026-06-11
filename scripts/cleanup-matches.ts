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

async function deleteCollection(collectionPath: string, batchSize = 100) {
  const col = db.collection(collectionPath);
  let deleted = 0;

  while (true) {
    const snap = await col.limit(batchSize).get();
    if (snap.empty) break;

    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += snap.size;
    console.log(`  Deleted ${deleted} docs from ${collectionPath} so far…`);
  }

  console.log(`✓ Collection "${collectionPath}" deleted (${deleted} docs total)`);
}

async function removeNextMatchFromBayArea() {
  const col = db.collection("wc2026_fanzones");
  const snap = await col.where("country", "==", "bay_area").get();

  if (snap.empty) {
    console.log("No bay_area fan zones found.");
    return;
  }

  const batch = db.batch();
  snap.docs.forEach((d) => {
    batch.update(d.ref, { nextMatch: admin.firestore.FieldValue.delete() });
  });
  await batch.commit();

  console.log(`✓ Removed "nextMatch" field from ${snap.size} bay_area fan zone(s)`);
}

async function run() {
  console.log("=== Cleanup script ===\n");

  console.log("1. Deleting wc2026_matches collection…");
  await deleteCollection("wc2026_matches");

  console.log("\n2. Removing nextMatch from bay_area fan zones…");
  await removeNextMatchFromBayArea();

  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
