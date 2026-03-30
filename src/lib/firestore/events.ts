// src/lib/firestore/events.ts
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  getDoc,
  type Unsubscribe,
} from "firebase/firestore";

export type CronosEvent = {
  id: string;
  title: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  dateISO: string;
  status: "draft" | "published" | "live" | "closed";
  capacity: number;
  venueId: string;
  venueName: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  // Legacy fields for UI compatibility (present in seeded docs)
  type?: "soccer" | "boxing";
  attendees?: number;
  split?: { aLabel: string; aCount: number; bLabel: string; bCount: number };
};

export async function getPublishedEvents(): Promise<CronosEvent[]> {
  const q = query(collection(db, "events"), where("status", "==", "published"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CronosEvent));
}

export function subscribeToEvents(
  callback: (events: CronosEvent[]) => void
): Unsubscribe {
  const q = query(collection(db, "events"), where("status", "==", "published"));
  return onSnapshot(q, (snap) => {
    const events = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CronosEvent));
    callback(events);
  });
}

export async function getEventById(id: string): Promise<CronosEvent | null> {
  const snap = await getDoc(doc(db, "events", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as CronosEvent;
}
