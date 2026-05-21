"use client";

import { useEffect } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useLangStore } from "@/lib/store";
import { detectLanguage } from "@/lib/i18n";

const content = {
  es: {
    title: "Términos y Condiciones",
    updated: "Última actualización: 1 de mayo de 2026",
    sections: [
      {
        title: "1. Uso del sitio — Edad mínima",
        body: "El uso de la plataforma Cronos Sports, disponible en cronosports.app, está permitido únicamente para personas mayores de 13 años. Al crear una cuenta, el usuario declara tener al menos 13 años de edad. Los usuarios entre 13 y 18 años deben contar con la autorización de su tutor legal. Cronos Sports se reserva el derecho de cancelar cuentas que violen este requisito.",
      },
      {
        title: "2. Descripción del servicio",
        body: "Cronos Sports es una plataforma digital que conecta a aficionados al fútbol con Fan Zones, Fan Festivals y eventos de watch party del Mundial 2026 en USA, Canadá y México. El servicio incluye: visualización de eventos programados, reservaciones en establecimientos participantes, participación en el bracket del Mundial y actividades de entretenimiento como quinielas y giveaways.",
      },
      {
        title: "3. El Bracket — Concurso gratuito sin compra necesaria",
        body: "El bracket del Mundial 2026 organizado por Cronos Sports es un concurso de predicción completamente gratuito. NO SE REQUIERE NINGUNA COMPRA para participar ni para ganar. La elegibilidad y las instrucciones de participación alternativas están disponibles en hola@cronosports.app. El concurso está abierto a residentes legales de los Estados Unidos mayores de 13 años.",
      },
      {
        title: "4. Premio del bracket (NO PURCHASE NECESSARY)",
        body: "NO ES NECESARIO REALIZAR UNA COMPRA PARA PARTICIPAR O GANAR. El premio del bracket del Mundial Cronos Sports consiste en una tarjeta de regalo o premio en efectivo equivalente de entre $200 y $300 USD, patrocinado íntegramente por Cronos Sports. El ganador se determinará por mayor puntuación acumulada en las predicciones del torneo según las reglas publicadas. Cronos Sports se reserva el derecho de modificar el monto del premio hasta la fecha de inicio del torneo. En caso de empate, se realizará un sorteo aleatorio entre los participantes empatados. Void where prohibited by law.",
      },
      {
        title: "5. Cambios de fechas y eventos",
        body: "Cronos Sports se reserva el derecho de modificar, posponer, cancelar o reprogramar cualquier evento, fecha de actividad, o característica del servicio en cualquier momento, sin previo aviso. Esto incluye cambios en las fechas del bracket, eventos de watch party, Fan Zones y cualquier actividad promocional. Cronos Sports no será responsable por gastos incurridos por el usuario en relación con un evento modificado o cancelado.",
      },
      {
        title: "6. Registro y cuentas",
        body: "Para acceder a las funcionalidades completas, el usuario debe registrarse con información veraz y actualizada, incluyendo nombre completo, email o número de teléfono, ciudad de residencia y equipo favorito. El usuario es responsable de mantener la confidencialidad de su cuenta. Cronos Sports puede suspender cuentas que proporcionen información falsa o que violen estos términos.",
      },
      {
        title: "7. Consentimiento de comunicaciones",
        body: "Al registrarse y marcar la casilla de consentimiento, el usuario autoriza a Cronos Sports a enviar comunicaciones sobre eventos, promociones, el bracket y noticias relacionadas con el Mundial 2026. El usuario puede cancelar estas comunicaciones en cualquier momento enviando un correo a hola@cronosports.app o usando el enlace de baja en cada correo.",
      },
      {
        title: "8. Privacidad y datos",
        body: "Cronos Sports recopila y procesa datos personales exclusivamente para prestar el servicio. Los datos incluyen: nombre, email, teléfono, ciudad, equipo favorito e historial de participación. Cronos Sports nunca vende datos a terceros. Consulta nuestra Política de Privacidad completa en /privacy para más detalles sobre tus derechos CCPA.",
      },
      {
        title: "9. Consentimiento de grabación e imagen",
        body: "Al asistir a eventos organizados por Cronos Sports, el usuario otorga su consentimiento para ser grabado en video, foto y audio. Cronos Sports puede usar este material en redes sociales y materiales de marketing. El usuario puede solicitar la eliminación de su imagen enviando un correo a hola@cronosports.app.",
      },
      {
        title: "10. Limitación de responsabilidad",
        body: "Cronos Sports no será responsable por daños directos, indirectos o consecuentes derivados del uso de la plataforma; cancelación de eventos; calidad del servicio de establecimientos terceros; o interrupciones técnicas. En ningún caso la responsabilidad total de Cronos Sports excederá el monto pagado por el usuario en los últimos 12 meses, o $100 USD si no hubo pago.",
      },
      {
        title: "11. Propiedad intelectual",
        body: "El nombre Cronos Sports, logotipo, diseño de la interfaz, código fuente y contenidos son propiedad exclusiva de Cronos Sports. Queda prohibida su reproducción, distribución o uso comercial sin autorización escrita previa.",
      },
      {
        title: "12. Ley aplicable y jurisdicción",
        body: "Estos términos se rigen por las leyes del Estado de California, Estados Unidos. Cualquier disputa será sometida a la jurisdicción de los tribunales competentes del Condado de Alameda, California.",
      },
      {
        title: "13. Contacto",
        body: "Para consultas, solicitudes o reclamaciones relacionadas con estos términos: hola@cronosports.app. Cronos Sports responde en un máximo de 5 días hábiles.",
      },
    ],
  },
  en: {
    title: "Terms and Conditions",
    updated: "Last updated: May 1, 2026",
    sections: [
      {
        title: "1. Use of site — Minimum age",
        body: "Use of the Cronos Sports platform, available at cronosports.app, is permitted only for people over 13 years of age. By creating an account, the user declares they are at least 13 years old. Users between 13 and 18 must have authorization from their legal guardian. Cronos Sports reserves the right to cancel accounts that violate this requirement.",
      },
      {
        title: "2. Service description",
        body: "Cronos Sports is a digital platform that connects soccer fans with Fan Zones, Fan Festivals, and World Cup 2026 watch party events in the USA, Canada, and Mexico. The service includes: viewing scheduled events, reservations at participating venues, participation in the World Cup bracket, and entertainment activities such as contests and giveaways.",
      },
      {
        title: "3. The Bracket — Free contest, no purchase necessary",
        body: "The World Cup 2026 bracket organized by Cronos Sports is a completely free prediction contest. NO PURCHASE IS REQUIRED to enter or win. Eligibility and alternative entry instructions are available at hola@cronosports.app. The contest is open to legal residents of the United States who are 13 years of age or older.",
      },
      {
        title: "4. Bracket prize (NO PURCHASE NECESSARY)",
        body: "NO PURCHASE NECESSARY TO ENTER OR WIN. The Cronos Sports World Cup bracket prize consists of a gift card or equivalent cash prize of between $200 and $300 USD, sponsored entirely by Cronos Sports. The winner will be determined by the highest cumulative score in tournament predictions according to the published rules. Cronos Sports reserves the right to modify the prize amount until the tournament start date. In the event of a tie, a random draw will be held among tied participants. Void where prohibited by law.",
      },
      {
        title: "5. Date and event changes",
        body: "Cronos Sports reserves the right to modify, postpone, cancel, or reschedule any event, activity date, or service feature at any time, without prior notice. This includes changes to bracket dates, watch party events, Fan Zones, and any promotional activities. Cronos Sports will not be liable for expenses incurred by users in connection with a modified or cancelled event.",
      },
      {
        title: "6. Registration and accounts",
        body: "To access full functionality, users must register with accurate and up-to-date information, including full name, email or phone number, city of residence, and favorite team. Users are responsible for maintaining the confidentiality of their account. Cronos Sports may suspend accounts that provide false information or violate these terms.",
      },
      {
        title: "7. Communications consent",
        body: "By registering and checking the consent box, the user authorizes Cronos Sports to send communications about events, promotions, the bracket, and World Cup 2026 news. Users can cancel these communications at any time by emailing hola@cronosports.app or using the unsubscribe link in any email.",
      },
      {
        title: "8. Privacy and data",
        body: "Cronos Sports collects and processes personal data solely to provide the service. Data collected includes: name, email, phone, city, favorite team, and participation history. Cronos Sports never sells data to third parties. See our full Privacy Policy at /privacy for details about your CCPA rights.",
      },
      {
        title: "9. Recording and image consent",
        body: "By attending events organized by Cronos Sports, the user consents to being recorded in video, photo, and audio. Cronos Sports may use this material on social media and marketing materials. Users can request removal of their image by emailing hola@cronosports.app.",
      },
      {
        title: "10. Limitation of liability",
        body: "Cronos Sports will not be liable for direct, indirect, or consequential damages arising from use of the platform; event cancellations; quality of third-party venue services; or technical interruptions. In no event will Cronos Sports' total liability exceed the amount paid by the user in the last 12 months, or $100 USD if no payment was made.",
      },
      {
        title: "11. Intellectual property",
        body: "The name Cronos Sports, logo, interface design, source code, and content are the exclusive property of Cronos Sports. Reproduction, distribution, or commercial use without prior written authorization is prohibited.",
      },
      {
        title: "12. Applicable law and jurisdiction",
        body: "These terms are governed by the laws of the State of California, United States. Any dispute will be subject to the exclusive jurisdiction of the competent courts of Alameda County, California.",
      },
      {
        title: "13. Contact",
        body: "For questions, requests, or complaints related to these terms: hola@cronosports.app. Cronos Sports responds within 5 business days.",
      },
    ],
  },
};

export default function TermsPage() {
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
