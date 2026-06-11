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
      bannerSubtitle: "Fan Zones y Watch Parties oficiales en el Bay Area",
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
      searchPlaceholder: "Buscar por ciudad o lugar...",
      searchClear: "Limpiar",
      loginToSave: "Inicia sesión para guardar tus favoritos",
      tournamentChampions: "🏆 Champions League",
      tournamentWorldCup: "🌍 World Cup 2026",
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
    detail: {
      back: "← Volver",
      notFound: "Fan Zone no encontrado",
      notFoundBtn: "Volver al inicio",
    },
    nav: {
      home: "Inicio",
      map: "Mapa",
      profile: "Perfil",
    },
    auth: {
      email: "Email",
      password: "Contraseña",
      confirmPassword: "Confirmar contraseña",
      fullName: "Nombre completo",
      login: "Iniciar sesión",
      register: "Registrarse",
      forgotPassword: "¿Olvidaste tu contraseña?",
      resetSent: "Te enviamos un email para restablecer tu contraseña",
      noAccount: "¿No tienes cuenta?",
      hasAccount: "¿Ya tienes cuenta?",
      loginHere: "Inicia sesión aquí",
      registerHere: "Regístrate aquí",
      passwordMin: "Mínimo 6 caracteres",
      passwordMatch: "Las contraseñas no coinciden",
      withEmail: "Con correo",
      withPhone: "Con teléfono",
      favoriteTeam: "Equipo favorito",
      favoriteTeamPlaceholder: "Ej. América, Chivas, Barcelona...",
      optional: "(opcional)",
      sendCode: "Enviar código",
      verifyCode: "Verificar código",
      codeSent: "Código enviado a tu teléfono",
      enterCode: "Ingresa el código de 6 dígitos",
      forgotPasswordTitle: "Restablecer contraseña",
      forgotPasswordSubtitle: "Te enviaremos un email con instrucciones",
      sendInstructions: "Enviar instrucciones",
      resetEmailSent: "Revisa tu bandeja de entrada y sigue las instrucciones.",
      backToLogin: "Volver al login",
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
        "Official Fan Zones and Watch Parties in the Bay Area",
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
      searchPlaceholder: "Search by city or venue...",
      searchClear: "Clear",
      loginToSave: "Log in to save your favorites",
      tournamentChampions: "🏆 Champions League",
      tournamentWorldCup: "🌍 World Cup 2026",
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
    detail: {
      back: "← Back",
      notFound: "Fan Zone not found",
      notFoundBtn: "Back to home",
    },
    nav: {
      home: "Home",
      map: "Map",
      profile: "Profile",
    },
    auth: {
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm password",
      fullName: "Full name",
      login: "Log in",
      register: "Sign up",
      forgotPassword: "Forgot your password?",
      resetSent: "We sent you an email to reset your password",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      loginHere: "Log in here",
      registerHere: "Sign up here",
      passwordMin: "Minimum 6 characters",
      passwordMatch: "Passwords don't match",
      withEmail: "With email",
      withPhone: "With phone",
      favoriteTeam: "Favorite team",
      favoriteTeamPlaceholder: "E.g. América, Chivas, Barcelona...",
      optional: "(optional)",
      sendCode: "Send code",
      verifyCode: "Verify code",
      codeSent: "Code sent to your phone",
      enterCode: "Enter the 6-digit code",
      forgotPasswordTitle: "Reset password",
      forgotPasswordSubtitle: "We'll send you an email with instructions",
      sendInstructions: "Send instructions",
      resetEmailSent: "Check your inbox and follow the instructions.",
      backToLogin: "Back to login",
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

    // Fechas y períodos
    "11 jun – 19 jul 2026": "Jun 11 – Jul 19, 2026",
    "11 jun – 19 jul 2026 (39 días)": "Jun 11 – Jul 19, 2026 (39 days)",
    "11 jun – 14 jun 2026": "Jun 11 – Jun 14, 2026",
    "11 jun – 15 jun 2026": "Jun 11 – Jun 15, 2026",
    "11 jun – 14 jul 2026": "Jun 11 – Jul 14, 2026",
    "11 jun – 14 jul 2026 (34 días)": "Jun 11 – Jul 14, 2026 (34 days)",
    "11 jun – 13 jul 2026 (18 días)": "Jun 11 – Jul 13, 2026 (18 days)",
    "11 jun – 15 jun 2026 (5 días)": "Jun 11 – Jun 15, 2026 (5 days)",
    "12 jun – 19 jul 2026": "Jun 12 – Jul 19, 2026",
    "13 jun – 5 jul 2026": "Jun 13 – Jul 5, 2026",
    "13 jun – 19 jul 2026": "Jun 13 – Jul 19, 2026",
    "17 jun – 28 jun 2026": "Jun 17 – Jun 28, 2026",
    "18 jun 2026 (México vs Corea del Sur)": "Jun 18, 2026 (Mexico vs South Korea)",
    "29 jun – 2 jul 2026": "Jun 29 – Jul 2, 2026",
    "4 jul – 19 jul 2026": "Jul 4 – Jul 19, 2026",
    "6 jul – 19 jul 2026": "Jul 6 – Jul 19, 2026",
    "9–11 jul 2026": "Jul 9–11, 2026",
    "11 jul 2026": "Jul 11, 2026",
    "14–15 y 18–19 jul 2026": "Jul 14–15 and 18–19, 2026",
    "18–19 jul 2026": "Jul 18–19, 2026",
    "13–14 jun 2026": "Jun 13–14, 2026",
    "2–5 jul 2026": "Jul 2–5, 2026",
    "4–5 jul 2026": "Jul 4–5, 2026",
    "25–28 jun 2026": "Jun 25–28, 2026",
    "Fechas selectas Jun–Jul 2026": "Select dates Jun–Jul 2026",
    "Jun – Jul 2026": "Jun – Jul 2026",
    "20 días durante el torneo": "20 days during the tournament",
    "~20 días durante el torneo": "~20 days during the tournament",
    "Hasta 16 días en jun 2026": "Up to 16 days in Jun 2026",
    "Por confirmar": "To be confirmed",
    "Partidos de México y destacados": "Mexico matches and featured games",
    "11 jun – 19 jul 2026 (39 días, 104 partidos)": "Jun 11 – Jul 19, 2026 (39 days, 104 matches)",
  };

  // Buscar traducción exacta primero
  if (dict[text]) return dict[text];

  // Si no hay traducción exacta, devolver el texto original
  return text;
}
