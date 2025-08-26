// src/lib/matches.ts
export type Match = {
  id: string;
  league: string;
  home: string;
  away: string;
  dateISO: string; // ISO string
  restaurant: { name: string; address: string };
};

export const MATCHES: Match[] = [
  {
    id: "1",
    league: "LaLiga",
    home: "Real Madrid",
    away: "Barcelona",
    dateISO: "2025-09-12T19:00:00-05:00",
    restaurant: { name: "La Tribuna Sports Bar", address: "Av. Centro 123" },
  },
  {
    id: "2",
    league: "Liga MX",
    home: "América",
    away: "Chivas",
    dateISO: "2025-09-14T20:30:00-05:00",
    restaurant: { name: "Bar Futbolero", address: "Calle Reforma 456" },
  },
  {
    id: "3",
    league: "Premier League",
    home: "Arsenal",
    away: "Man City",
    dateISO: "2025-09-15T13:00:00-05:00",
    restaurant: { name: "Corner Pub", address: "Wembley 12" },
  },
  {
    id: "4",
    league: "Serie A",
    home: "Inter",
    away: "Juventus",
    dateISO: "2025-09-18T14:00:00-05:00",
    restaurant: { name: "Osteria Calcio", address: "Via Roma 5" },
  },
  {
    id: "5",
    league: "MLS",
    home: "LAFC",
    away: "Austin",
    dateISO: "2025-09-19T19:30:00-05:00",
    restaurant: { name: "LA Sports House", address: "Sunset Blvd 77" },
  },
  {
    id: "6",
    league: "Champions",
    home: "PSG",
    away: "Bayern",
    dateISO: "2025-09-21T14:45:00-05:00",
    restaurant: { name: "Le Parc Café", address: "Rue Sport 10" },
  },
];
