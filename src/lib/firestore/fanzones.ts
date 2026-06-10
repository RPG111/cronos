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
export type FanZoneCountry = "usa" | "canada" | "mexico" | "bay_area";
export type FanZoneEntry = string; // "Gratuita" | "Requiere registro" | "Ticketed" | etc.

export type FanZoneEntryType = "walk_in" | "registration_required" | "paid";

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
  entryType?: FanZoneEntryType;
  price?: string | null;
  datesOpen: string;
  startDate?: string | null;
  endDate?: string | null;
  officialUrl: string | null;
  registrationUrl: string | null;
  notes: string | null;
  food: string | null;
  alcohol: boolean | null;
  amenities: string | null;
  active: boolean;
  status?: "active" | "coming_soon";
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
  return (a.city ?? "").localeCompare(b.city ?? "");
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

