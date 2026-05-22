"use client";

import { useEffect } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useLangStore } from "@/lib/store";
import { detectLanguage } from "@/lib/i18n";

const content = {
  es: {
    title: "Política de Privacidad",
    updated: "Última actualización: 1 de mayo de 2026",
    sections: [
      {
        title: "1. Qué datos recolectamos",
        body: "Al registrarte en Cronos Sports recopilamos: nombre completo, dirección de correo electrónico, número de teléfono, ciudad de residencia, equipo deportivo favorito y ubicación aproximada (solo si otorgas permiso en tu dispositivo). No recolectamos datos de pago ni información financiera.",
      },
      {
        title: "2. Para qué usamos tus datos",
        body: "Usamos tu información para: personalizar los eventos y Fan Zones cercanos a tu ubicación, enviarte comunicaciones sobre eventos del Mundial 2026, promociones, el bracket y giveaways de Cronos Sports, y mejorar la experiencia dentro de la plataforma. Nunca usamos tus datos para fines distintos a los aquí descritos.",
      },
      {
        title: "3. Con quién compartimos tus datos",
        body: "Nunca vendemos ni arrendamos tus datos personales a terceros. Solo compartimos información con proveedores de servicios técnicos estrictamente necesarios para operar la plataforma (Firebase/Google para almacenamiento, Twilio para SMS, Resend para email). Estos proveedores están obligados contractualmente a proteger tu información.",
      },
      {
        title: "4. Email marketing y comunicaciones",
        body: "Si otorgaste consentimiento al registrarte, te enviaremos correos sobre eventos, promociones y noticias de Cronos Sports. Puedes cancelar la suscripción en cualquier momento haciendo clic en el enlace de baja incluido en cada correo, o escribiendo a cronos0sports@gmail.com.",
      },
      {
        title: "5. Tus derechos (CCPA y privacidad general)",
        body: "De acuerdo con la Ley de Privacidad del Consumidor de California (CCPA) y principios generales de privacidad, tienes derecho a: conocer qué datos personales tenemos sobre ti, solicitar una copia de tus datos, corregir información incorrecta, y solicitar la eliminación completa de tus datos. Para ejercer cualquiera de estos derechos, escríbenos a cronos0sports@gmail.com con el asunto \"Privacidad – [tu nombre]\". Respondemos en un máximo de 30 días hábiles.",
      },
      {
        title: "6. Cookies",
        body: "Usamos únicamente cookies esenciales de funcionamiento: cookies de sesión de Firebase Authentication para mantenerte conectado, y cookies de Zustand para recordar tus preferencias de idioma y ubicación durante la sesión. No usamos cookies de seguimiento, publicidad ni analytics de terceros.",
      },
      {
        title: "7. Seguridad",
        body: "Tus datos se almacenan de forma segura en servidores de Google Firebase, protegidos con cifrado en tránsito (HTTPS/TLS) y en reposo. Adoptamos medidas técnicas y organizativas razonables para proteger tu información contra acceso no autorizado.",
      },
      {
        title: "8. Menores de edad",
        body: "El servicio está disponible para personas mayores de 13 años. No recopilamos intencionalmente información de menores de 13 años. Si crees que un menor ha proporcionado sus datos, contáctanos en cronos0sports@gmail.com para eliminarlos.",
      },
      {
        title: "9. Cambios a esta política",
        body: "Podemos actualizar esta Política de Privacidad ocasionalmente. Notificaremos cualquier cambio material publicando la nueva versión en esta página con la fecha de actualización. Te recomendamos revisar esta página periódicamente.",
      },
      {
        title: "10. Contacto",
        body: "Para cualquier pregunta, solicitud o ejercicio de tus derechos de privacidad, contáctanos en: cronos0sports@gmail.com. Cronos Sports — Bay Area, California, USA.",
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: May 1, 2026",
    sections: [
      {
        title: "1. What data we collect",
        body: "When you register with Cronos Sports we collect: full name, email address, phone number, city of residence, favorite sports team, and approximate location (only if you grant permission on your device). We do not collect payment information or financial data.",
      },
      {
        title: "2. How we use your data",
        body: "We use your information to: personalize events and Fan Zones near your location, send you communications about World Cup 2026 events, promotions, the bracket, and Cronos Sports giveaways, and improve your experience on the platform. We never use your data for purposes other than those described here.",
      },
      {
        title: "3. Who we share your data with",
        body: "We never sell or rent your personal data to third parties. We only share information with technical service providers strictly necessary to operate the platform (Firebase/Google for storage, Twilio for SMS, Resend for email). These providers are contractually required to protect your information.",
      },
      {
        title: "4. Email marketing and communications",
        body: "If you gave consent at registration, we will send you emails about Cronos Sports events, promotions, and news. You can unsubscribe at any time by clicking the unsubscribe link included in every email, or by writing to cronos0sports@gmail.com.",
      },
      {
        title: "5. Your rights (CCPA and general privacy)",
        body: "Under the California Consumer Privacy Act (CCPA) and general privacy principles, you have the right to: know what personal data we hold about you, request a copy of your data, correct inaccurate information, and request complete deletion of your data. To exercise any of these rights, email us at cronos0sports@gmail.com with the subject line \"Privacy – [your name]\". We respond within 30 business days.",
      },
      {
        title: "6. Cookies",
        body: "We use only essential functional cookies: Firebase Authentication session cookies to keep you logged in, and Zustand cookies to remember your language and location preferences during your session. We do not use tracking, advertising, or third-party analytics cookies.",
      },
      {
        title: "7. Security",
        body: "Your data is stored securely on Google Firebase servers, protected with encryption in transit (HTTPS/TLS) and at rest. We adopt reasonable technical and organizational measures to protect your information from unauthorized access.",
      },
      {
        title: "8. Minors",
        body: "The service is available to people over 13 years of age. We do not intentionally collect information from children under 13. If you believe a minor has provided their data, contact us at cronos0sports@gmail.com to have it removed.",
      },
      {
        title: "9. Changes to this policy",
        body: "We may update this Privacy Policy occasionally. We will notify you of any material changes by posting the new version on this page with the updated date. We recommend reviewing this page periodically.",
      },
      {
        title: "10. Contact",
        body: "For any questions, requests, or to exercise your privacy rights, contact us at: cronos0sports@gmail.com. Cronos Sports — Bay Area, California, USA.",
      },
    ],
  },
};

export default function PrivacyPage() {
  const { lang, setLang } = useLangStore();

  useEffect(() => {
    setLang(detectLanguage());
  }, [setLang]);

  const c = content[lang];

  return (
    <>
      <Header />
      <main style={{ background: "#080c14", minHeight: "100dvh", paddingBottom: "120px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", padding: "32px 20px" }}>
          <h1 style={{ color: "#e8f0ff", fontSize: "26px", fontWeight: 700, marginBottom: "6px" }}>
            {c.title}
          </h1>
          <p style={{ color: "#8899bb", fontSize: "12px", marginBottom: "32px" }}>{c.updated}</p>

          {c.sections.map((section, i) => (
            <div
              key={i}
              style={{
                background: "#0a1220",
                border: "1px solid #142035",
                borderRadius: "16px",
                padding: "20px 24px",
                marginBottom: "12px",
              }}
            >
              <h2
                style={{
                  color: "#ff8c00",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                }}
              >
                {section.title}
              </h2>
              <p style={{ color: "#c8d8f0", fontSize: "14px", lineHeight: "1.8", margin: 0 }}>
                {section.body}
              </p>
            </div>
          ))}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
