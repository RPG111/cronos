// src/lib/teams.ts
export type TeamOption = { id: string; name: string; country?: string; league?: string };

export const POPULAR_TEAMS: TeamOption[] = [
  // 🌎 Selecciones
  { id: "mex", name: "México", country: "México" },
  { id: "usa", name: "Estados Unidos", country: "USA" },
  { id: "jpn", name: "Japón", country: "Japón" },
  { id: "arg", name: "Argentina", country: "Argentina" },
  { id: "bra", name: "Brasil", country: "Brasil" },
  { id: "esp", name: "España", country: "España" },

  // 🇪🇸 LaLiga
  { id: "rm", name: "Real Madrid", league: "LaLiga" },
  { id: "fcb", name: "FC Barcelona", league: "LaLiga" },
  { id: "atm", name: "Atlético de Madrid", league: "LaLiga" },
  { id: "sev", name: "Sevilla", league: "LaLiga" },

  // 🏴 EPL
  { id: "mu", name: "Manchester United", league: "Premier League" },
  { id: "mc", name: "Manchester City", league: "Premier League" },
  { id: "liv", name: "Liverpool", league: "Premier League" },
  { id: "ars", name: "Arsenal", league: "Premier League" },
  { id: "che", name: "Chelsea", league: "Premier League" },
  { id: "tot", name: "Tottenham", league: "Premier League" },

  // 🇮🇹 Serie A
  { id: "juv", name: "Juventus", league: "Serie A" },
  { id: "mil", name: "AC Milan", league: "Serie A" },
  { id: "int", name: "Inter", league: "Serie A" },
  { id: "nap", name: "Napoli", league: "Serie A" },

  // 🇩🇪 Bundesliga
  { id: "fcb_b", name: "Bayern München", league: "Bundesliga" },
  { id: "bvb", name: "Borussia Dortmund", league: "Bundesliga" },
  { id: "rb", name: "RB Leipzig", league: "Bundesliga" },

  // 🇲🇽 Liga MX
  { id: "ame", name: "América", league: "Liga MX" },
  { id: "tig", name: "Tigres", league: "Liga MX" },
  { id: "mon", name: "Monterrey", league: "Liga MX" },
  { id: "gua", name: "Guadalajara (Chivas)", league: "Liga MX" },
  { id: "pum", name: "Pumas", league: "Liga MX" },
  { id: "tol", name: "Toluca", league: "Liga MX" },
  { id: "leon", name: "León", league: "Liga MX" },
  { id: "san", name: "Santos Laguna", league: "Liga MX" },

  // 🇺🇸 MLS
  { id: "mia", name: "Inter Miami", league: "MLS" },
  { id: "lafc", name: "LAFC", league: "MLS" },
  { id: "lag", name: "LA Galaxy", league: "MLS" },
  { id: "atl", name: "Atlanta United", league: "MLS" },


];
