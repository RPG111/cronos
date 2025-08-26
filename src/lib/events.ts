// src/lib/events.ts

export type EventType = "soccer" | "boxing";

export type EventItem = {
  id: string;
  type: EventType;
  league: string;
  title: string;
  dateISO: string;
  venueName: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  attendees: number;
  split: { aLabel: string; aCount: number; bLabel: string; bCount: number };
};

export const EVENTS: EventItem[] = [
  {
    id: "mexico-japon-2025-09-06-oak",
    type: "soccer",
    league: "Amistoso Internacional",
    title: "México vs Japón",
    dateISO: "2025-09-06T18:30:00-07:00",
    venueName: "Bar Futbolero (provisional)",
    address: "Av. Centro 123",
    city: "Oakland, CA",
    lat: 37.8044,
    lng: -122.2712,
    attendees: 18,
    split: { aLabel: "México", aCount: 14, bLabel: "Japón", bCount: 4 },
  },
  {
    id: "canelo-crawford-2025-09-13-lv",
    type: "boxing",
    league: "Boxeo",
    title: "Canelo Álvarez vs Terence Crawford",
    dateISO: "2025-09-13T14:30:00-07:00",
    venueName: "Corner Pub (provisional)",
    address: "Sunset Blvd 77",
    city: "Las Vegas, NV",
    lat: 36.1147,
    lng: -115.1728,
    attendees: 9,
    split: { aLabel: "Canelo", aCount: 7, bLabel: "Crawford", bCount: 2 },
  },
];

export function fmtDateShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-MX", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtDateLong(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}
