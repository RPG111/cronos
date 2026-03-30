// src/lib/firestore/seed.ts
// Run ONCE from admin to populate Firestore with initial event data.
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { EVENTS } from "../events";
import type { CronosEvent } from "./events";

const SEED_EXTRA: Record<string, Pick<CronosEvent, "homeTeam" | "awayTeam" | "venueId" | "status" | "capacity">> = {
  "mexico-japon-2025-09-06-oak": {
    homeTeam: "México",
    awayTeam: "Japón",
    venueId: "bar-futbolero-oak",
    status: "published",
    capacity: 20,
  },
  "canelo-crawford-2025-09-13-lv": {
    homeTeam: "Canelo Álvarez",
    awayTeam: "Terence Crawford",
    venueId: "corner-pub-lv",
    status: "published",
    capacity: 20,
  },
};

export async function seedEvents(): Promise<void> {
  for (const ev of EVENTS) {
    const extra = SEED_EXTRA[ev.id] ?? {
      homeTeam: "",
      awayTeam: "",
      venueId: ev.id,
      status: "published" as const,
      capacity: 20,
    };

    const data = {
      title: ev.title,
      league: ev.league,
      homeTeam: extra.homeTeam,
      awayTeam: extra.awayTeam,
      dateISO: ev.dateISO,
      status: extra.status,
      capacity: extra.capacity,
      venueId: extra.venueId,
      venueName: ev.venueName,
      address: ev.address,
      city: ev.city,
      lat: ev.lat,
      lng: ev.lng,
      // Legacy fields preserved for UI compatibility
      type: ev.type,
      attendees: ev.attendees,
      split: ev.split,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "events", ev.id), data);
    console.log(`Seeded: ${ev.id}`);
  }
  console.log("seedEvents complete.");
}
