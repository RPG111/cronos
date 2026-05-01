// src/lib/i18n.ts
// Traducciones ES/EN. Detección automática por navigator.language.
import { useEffect } from "react";
import { useLangStore } from "./store";

export type Lang = "es" | "en";

export const translations = {
  es: {
    header: {
      restaurant: "Soy restaurante",
      logout: "Cerrar sesión",
      login: "Iniciar sesión",
    },
    home: {
      bannerTitle: "Encuentra dónde ver el Mundial 2026 cerca de ti.",
      bannerSubtitle: "Fan Zones y Fan Festivals oficiales en USA, Canadá y México.",
      countdownLabel: "⏱ Faltan",
      countdownUnits: { days: "d", hours: "h", mins: "m", secs: "s" },
      filterAll: "Todos",
      filterFanFestival: "Fan Festival",
      filterFanZone: "Fan Zone",
      countryMexico: "🇲🇽 México",
      countryUSA: "🇺🇸 USA",
      countryCanada: "🇨🇦 Canadá",
      countries: { usa: "EE.UU.", canada: "Canadá", mexico: "México" },
      tooltipFanFestival:
        "Evento oficial organizado por FIFA. Pantallas gigantes, conciertos y activaciones. Algunos requieren registro anticipado.",
      tooltipFanZone:
        "Espacio local organizado por la comunidad para ver los partidos. Generalmente de entrada libre.",
      howToGet: "Cómo llegar",
      registerHere: "Regístrate aquí",
      officialSite: "Sitio oficial",
      register: "Registrarse",
      moreInfo: "Más info",
      moreInfoSoon: "Más información pronto",
      loading: "Cargando eventos…",
      noEvents: "No hay eventos disponibles.",
      fanFestivalBadge: "FIFA Fan Festival oficial",
      fanZoneBadge: "Fan Zone",
      ariaFavAdd: "Guardar en favoritos",
      ariaFavRemove: "Quitar de favoritos",
      ariaInfoFestival: "Información sobre Fan Festival",
      ariaInfoZone: "Información sobre Fan Zone",
    },
    map: {
      title: "Fan Zones — Mundial 2026",
      nearYou: "Mostrando eventos cerca de tu ubicación.",
      worldwide: "USA, Canadá y México. Toca un pin para ver detalles.",
    },
    profile: {
      bannerText:
        "Próximos eventos en el Bay Area — Regístrate para ser el primero en asistir a nuestros watch parties y reacciones en vivo.",
      registerBtn: "Registrarme",
      myProfile: "Mi perfil",
      confirmedReservations: "Tus reservas confirmadas.",
      loading: "Cargando…",
      noReservations: "Aún no tienes reservas.",
      savedFanZones: "Mis Fan Zones guardados",
      noSavedFanZones: "Aún no tienes Fan Zones guardados.",
      exploreEvents: "Explorar eventos",
      loginLink: "Inicia sesión",
      loginToViewAndSave:
        "para ver tus reservas y guardar tus Fan Zones favoritos.",
      loginToSave: "para guardar tus favoritos.",
      goingFor: "Vas — ",
      viewCancel: "Ver / Cancelar",
      viewQR: "Ver QR",
      fanFestivalBadge: "FIFA Fan Festival oficial",
      fanZoneBadge: "Fan Zone",
      registerLabel: "Registrarse",
      howToGet: "Cómo llegar",
      officialSite: "Sitio oficial",
    },
  },
  en: {
    header: {
      restaurant: "I'm a restaurant",
      logout: "Log out",
      login: "Log in",
    },
    home: {
      bannerTitle: "Find where to watch the 2026 World Cup near you.",
      bannerSubtitle:
        "Official Fan Zones and Fan Festivals in the USA, Canada and Mexico.",
      countdownLabel: "⏱ Time left",
      countdownUnits: { days: "d", hours: "h", mins: "m", secs: "s" },
      filterAll: "All",
      filterFanFestival: "Fan Festival",
      filterFanZone: "Fan Zone",
      countryMexico: "🇲🇽 Mexico",
      countryUSA: "🇺🇸 USA",
      countryCanada: "🇨🇦 Canada",
      countries: { usa: "USA", canada: "Canada", mexico: "Mexico" },
      tooltipFanFestival:
        "Official event organized by FIFA. Giant screens, concerts and activations. Some require advance registration.",
      tooltipFanZone:
        "Local space organized by the community to watch matches. Generally free entry.",
      howToGet: "Directions",
      registerHere: "Register here",
      officialSite: "Official site",
      register: "Register",
      moreInfo: "More info",
      moreInfoSoon: "More information coming soon",
      loading: "Loading events…",
      noEvents: "No events available.",
      fanFestivalBadge: "Official FIFA Fan Festival",
      fanZoneBadge: "Fan Zone",
      ariaFavAdd: "Save to favorites",
      ariaFavRemove: "Remove from favorites",
      ariaInfoFestival: "About Fan Festival",
      ariaInfoZone: "About Fan Zone",
    },
    map: {
      title: "Fan Zones — World Cup 2026",
      nearYou: "Showing events near your location.",
      worldwide: "USA, Canada and Mexico. Tap a pin to see details.",
    },
    profile: {
      bannerText:
        "Upcoming events in the Bay Area — Register to be the first to attend our watch parties and live reactions.",
      registerBtn: "Register",
      myProfile: "My profile",
      confirmedReservations: "Your confirmed reservations.",
      loading: "Loading…",
      noReservations: "You have no reservations yet.",
      savedFanZones: "My saved Fan Zones",
      noSavedFanZones: "You have no saved Fan Zones yet.",
      exploreEvents: "Explore events",
      loginLink: "Log in",
      loginToViewAndSave:
        "to view your reservations and save your favorite Fan Zones.",
      loginToSave: "to save your favorites.",
      goingFor: "Rooting for — ",
      viewCancel: "View / Cancel",
      viewQR: "View QR",
      fanFestivalBadge: "Official FIFA Fan Festival",
      fanZoneBadge: "Fan Zone",
      registerLabel: "Register",
      howToGet: "Directions",
      officialSite: "Official site",
    },
  },
};

export type Translations = typeof translations.es;

export function detectLanguage(): Lang {
  if (typeof navigator === "undefined") return "es";
  return navigator.language.startsWith("es") ? "es" : "en";
}

export function useTranslation(): Translations {
  const { lang, setLang } = useLangStore();
  useEffect(() => {
    setLang(detectLanguage());
  }, [setLang]);
  return translations[lang];
}

export function translateField(text: string, lang: Lang): string {
  if (lang === "es") return text;

  const dict: Record<string, string> = {
    // Entry
    "Gratuita": "Free",
    "Gratuita, sin registro requerido": "Free, no registration required",
    "Gratuita, requiere registro anticipado": "Free, advance registration required",
    "Gratuita, requiere ticket anticipado (Live Nation)": "Free, advance ticket required (Live Nation)",
    "Gratuita, sin alcohol": "Free, no alcohol",
    "Gratuita (partidos) / Ticketed (conciertos)": "Free (matches) / Ticketed (concerts)",
    "Gratuita (sujeto a cambio)": "Free (subject to change)",
    "Gratuita, requiere pase digital anticipado": "Free, advance digital pass required",
    "Requiere registro anticipado": "Advance registration required",
    "Ticketada ($12.50)": "Ticketed ($12.50)",
    "Desde $10 (niños 12 y menor gratis)": "From $10 (children 12 and under free)",
    "Requiere pase gratuito anticipado en kansascityfwc26.com": "Free advance pass required at kansascityfwc26.com",
    "Gratuita (asientos reservados en anfiteatro ticketados)": "Free (reserved amphitheater seats ticketed)",
    "TBC": "TBC",

    // Notes comunes
    "Sede completa. Transmite todos los partidos del torneo.": "Full venue. Broadcasts all tournament matches.",
    "Sede parcial. Transmite partidos de México y encuentros destacados.": "Partial venue. Broadcasts Mexico matches and featured games.",
    "Sede parcial. Ubicación exacta por confirmar. Más info pronto.": "Partial venue. Exact location to be confirmed. More info soon.",
    "Capacidad 8,000 personas. Organizado por gobierno de Zapopan.": "Capacity 8,000 people. Organized by Zapopan local government.",
    "Capacidad 10,000 personas. Organizado por gobierno de Zapopan.": "Capacity 10,000 people. Organized by Zapopan local government.",
    "Organizado por Bay Area Host Committee": "Organized by Bay Area Host Committee",
    "Organizado por ciudad de Bellingham": "Organized by City of Bellingham",
    "Organizado por ciudad de Everett": "Organized by City of Everett",
    "Organizado por ciudad de Spokane": "Organized by City of Spokane",
    "Organizado por Port of Olympia": "Organized by Port of Olympia",
    "Organizado por Puyallup Tribe y ciudad de Tacoma": "Organized by Puyallup Tribe and City of Tacoma",
    "Organizado por Yakima Host Committee": "Organized by Yakima Host Committee",
    "Anfiteatro de 10,000 personas. Conciertos: Mötley Crüe y Kx5 (Deadmau5 + Kaskade) en julio.": "10,000-person amphitheater. Concerts: Mötley Crüe and Kx5 (Deadmau5 + Kaskade) in July.",
    "Asociación FIFA y Telemundo. La pista de patinaje se convierte en campo de fútbol con pantallas gigantes.": "FIFA and Telemundo partnership. The ice rink becomes a soccer field with giant screens.",
    "Venues específicos por confirmar.": "Specific venues to be confirmed.",
    "16 zonas adicionales en las alcaldías de CDMX": "16 additional zones in CDMX districts",
    "Espacios adicionales en las alcaldías de CDMX": "Additional spaces in CDMX districts",
    "Plaza de la Liberación. 39 días, 104 partidos. Acceso libre y gratuito. Fan Zones adicionales en Zapopan confirmados.": "Plaza de la Liberación. 39 days, 104 matches. Free access. Additional Fan Zones confirmed in Zapopan.",
  };

  // Buscar traducción exacta primero
  if (dict[text]) return dict[text];

  // Si no hay traducción exacta, devolver el texto original
  return text;
}
