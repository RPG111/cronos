// src/lib/firestore/fanzones.ts
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";

export type FanZoneType = "fan_festival" | "fan_zone";
export type FanZoneCountry = "usa" | "canada" | "mexico";
export type FanZoneEntry = string; // "Gratuita" | "Requiere registro" | "Ticketed" | etc.

export type FanZone = {
  id: string;
  tournament?: string;
  type: FanZoneType;
  name: string;
  city: string;
  country: FanZoneCountry;
  venue: string;
  address: string;
  lat: number;
  lng: number;
  entry: FanZoneEntry;
  datesOpen: string;
  officialUrl: string | null;
  registrationUrl: string | null;
  notes: string | null;
  food: string | null;
  alcohol: boolean | null;
  amenities: string | null;
  active: boolean;
  updatedAt?: Timestamp;
};

// Distancia en km entre dos coordenadas (Haversine)
export function distanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const COUNTRY_ORDER: FanZoneCountry[] = ["usa", "canada", "mexico"];

// Ordenamiento por defecto: USA → Canadá → México, luego ciudad alfabéticamente
function sortByCountryAndCity(a: FanZone, b: FanZone): number {
  const ci = COUNTRY_ORDER.indexOf(a.country) - COUNTRY_ORDER.indexOf(b.country);
  if (ci !== 0) return ci;
  return a.city.localeCompare(b.city);
}

// Carga todos los fan zones activos (página pública)
export async function getActiveFanZones(
  userLat?: number | null,
  userLng?: number | null
): Promise<FanZone[]> {
  const q = query(
    collection(db, "wc2026_fanzones"),
    where("active", "==", true)
  );
  const snap = await getDocs(q);
  const zones = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FanZone));

  if (userLat != null && userLng != null) {
    return zones.sort((a, b) => {
      const da = distanceKm(userLat, userLng, a.lat, a.lng);
      const db_ = distanceKm(userLat, userLng, b.lat, b.lng);
      return da - db_;
    });
  }

  return zones.sort(sortByCountryAndCity);
}

// Carga todos (admin — incluye inactivos)
export async function getAllFanZones(): Promise<FanZone[]> {
  const snap = await getDocs(collection(db, "wc2026_fanzones"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as FanZone))
    .sort(sortByCountryAndCity);
}

export async function getFanZoneById(id: string): Promise<FanZone | null> {
  const snap = await getDoc(doc(db, "wc2026_fanzones", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as FanZone;
}

// Crear nuevo fan zone (admin)
export async function createFanZone(
  data: Omit<FanZone, "id" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "wc2026_fanzones"), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// Actualizar fan zone (admin)
export async function updateFanZone(
  id: string,
  data: Partial<Omit<FanZone, "id">>
): Promise<void> {
  await updateDoc(doc(db, "wc2026_fanzones", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// Guardar / quitar fan zone en favoritos del usuario
export async function saveFanZoneForUser(uid: string, fanZoneId: string): Promise<void> {
  await setDoc(
    doc(db, "users", uid, "savedFanZones", fanZoneId),
    { savedAt: serverTimestamp() }
  );
}

export async function removeFanZoneForUser(uid: string, fanZoneId: string): Promise<void> {
  const { deleteDoc } = await import("firebase/firestore");
  await deleteDoc(doc(db, "users", uid, "savedFanZones", fanZoneId));
}

export async function getSavedFanZoneIds(uid: string): Promise<string[]> {
  const snap = await getDocs(collection(db, "users", uid, "savedFanZones"));
  return snap.docs.map((d) => d.id);
}

// Migración: agrega tournament:"world_cup_2026" a docs que no lo tengan
export async function migrateTournamentField(): Promise<number> {
  const snap = await getDocs(collection(db, "wc2026_fanzones"));
  const batch: Promise<void>[] = [];
  snap.docs.forEach((d) => {
    if (!d.data().tournament) {
      batch.push(
        updateDoc(doc(db, "wc2026_fanzones", d.id), { tournament: "world_cup_2026" })
      );
    }
  });
  await Promise.all(batch);
  return batch.length;
}

// Seed: agrega los 3 eventos de Champions League Final 2026
export async function seedChampionsFanZones(): Promise<void> {
  const champions = [
    {
      id: "champions-splash-thrive",
      tournament: "champions_2026",
      type: "fan_zone" as FanZoneType,
      name: "Champions League Final — Splash at Thrive City",
      city: "San Francisco",
      country: "usa" as FanZoneCountry,
      venue: "Splash Sports Bar at Thrive City, Chase Center",
      address: "1 Warriors Way, San Francisco, CA 94158",
      lat: 37.7679,
      lng: -122.3874,
      entry: "Gratuita con RSVP — First come first served",
      datesOpen: "Sábado 31 mayo 2026 — Puertas 8am, Kickoff 9am",
      officialUrl: "https://www.eventbrite.com/e/champions-league-final-watch-party-at-splash-tickets-1987458938185",
      registrationUrl: "https://www.eventbrite.com/e/champions-league-final-watch-party-at-splash-tickets-1987458938185",
      notes: "30,000 sq ft sports bar con mega pantalla de 1,400 sq ft. DJ pre y post partido. Copa del mundo para foto. Simuladores de soccer, foosball y shuffleboard.",
      active: true,
    },
    {
      id: "champions-sf-vikings",
      tournament: "champions_2026",
      type: "fan_zone" as FanZoneType,
      name: "Champions League Final — SF Vikings Soccer Club",
      city: "San Francisco",
      country: "usa" as FanZoneCountry,
      venue: "Steins Beer Garden (German Beerhall)",
      address: "731 Clement St, San Francisco, CA 94118",
      lat: 37.7827,
      lng: -122.4672,
      entry: "Ticketado — $40 adultos / $25 menores de 21",
      datesOpen: "Sábado 31 mayo 2026",
      officialUrl: "https://www.zeffy.com/en-US/ticketing/2026-champions-league-watch-party",
      registrationUrl: "https://www.zeffy.com/en-US/ticketing/2026-champions-league-watch-party",
      notes: "Incluye asiento + brunch + medio litro de bebida. Ambiente íntimo de comunidad futbolera. Organizado por SF Vikings Soccer Club.",
      active: true,
    },
    {
      id: "champions-mas-bayarea",
      tournament: "champions_2026",
      type: "fan_zone" as FanZoneType,
      name: "Champions League Final — MAS Bay Area",
      city: "Santa Clara",
      country: "usa" as FanZoneCountry,
      venue: "MAS Bay Area",
      address: "2322 Walsh Avenue, Santa Clara, CA 95051",
      lat: 37.3512,
      lng: -121.9796,
      entry: "Por confirmar",
      datesOpen: "Sábado 31 mayo 2026",
      officialUrl: "https://www.masbayarea.org/masbaevents/champtions",
      registrationUrl: "https://www.masbayarea.org/masbaevents/champtions",
      notes: "Watch party organizado por la comunidad. Verificar detalles en el sitio oficial.",
      active: true,
    },
  ];

  await Promise.all(
    champions.map(({ id, ...data }) =>
      setDoc(doc(db, "wc2026_fanzones", id), { ...data, updatedAt: serverTimestamp() })
    )
  );
}
