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
