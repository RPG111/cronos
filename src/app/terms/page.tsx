import Link from "next/link";

export default function TermsPage() {
  return (
    <main style={{ background: "#080c14", minHeight: "100dvh", padding: "0 0 48px" }}>
      <header style={{ background: "#080c14", borderBottom: "1px solid #142035", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/home" style={{ color: "#3a5070", fontSize: "13px", textDecoration: "none" }}>← volver</Link>
        <span className="logo-cronos" style={{ fontSize: "20px" }}>CRONOS</span>
        <div style={{ width: "60px" }} />
      </header>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 20px" }}>
        <h1 style={{ color: "#e8f0ff", fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>términos y condiciones de uso</h1>
        <p style={{ color: "#3a5070", fontSize: "12px", marginBottom: "32px" }}>última actualización: 1 de abril de 2026</p>

        {[
          {
            title: "1. aceptación de términos",
            content: `al acceder, registrarse o utilizar la plataforma cronos, disponible en cronosports.app y sus aplicaciones asociadas, el usuario acepta de manera expresa, libre e informada la totalidad de los presentes términos y condiciones de uso. si el usuario no está de acuerdo con alguno de los términos aquí establecidos, deberá abstenerse de utilizar la plataforma. cronos se reserva el derecho de modificar estos términos en cualquier momento, siendo responsabilidad del usuario revisarlos periódicamente. el uso continuado de la plataforma después de cualquier modificación constituirá la aceptación de dichos cambios. estos términos constituyen un acuerdo legal vinculante entre el usuario y cronos. el usuario declara tener la capacidad legal suficiente para aceptar estos términos y, en caso de ser menor de 18 años, deberá contar con la autorización expresa de su tutor legal.`
          },
          {
            title: "2. descripción del servicio",
            content: `cronos es una plataforma digital que conecta a personas interesadas en ver eventos deportivos en vivo con restaurantes y establecimientos que transmiten dichos eventos. el servicio incluye, sin limitarse a: la visualización de eventos deportivos programados, la realización de reservaciones en establecimientos participantes, la participación en actividades de entretenimiento durante los eventos (quinielas, trivias, sorteos), la creación de un perfil de usuario y la interacción con la comunidad cronos. cronos actúa únicamente como intermediario entre los usuarios y los establecimientos, sin ser responsable de la calidad, disponibilidad o condiciones del servicio prestado por los restaurantes participantes. cronos puede agregar, modificar o eliminar funcionalidades del servicio en cualquier momento sin previo aviso.`
          },
          {
            title: "3. registro y elegibilidad",
            content: `para acceder a las funcionalidades completas de cronos, el usuario debe registrarse proporcionando información veraz, actualizada y completa, incluyendo nombre completo, número de teléfono y equipo deportivo favorito. el usuario es responsable de mantener la confidencialidad de su cuenta y de todas las actividades que ocurran bajo la misma. cronos se reserva el derecho de suspender o cancelar cuentas que proporcionen información falsa, que violen estos términos o que realicen actividades que perjudiquen a otros usuarios o a la plataforma. el registro en cronos está disponible para personas mayores de 13 años. los usuarios entre 13 y 18 años deben contar con autorización de su tutor legal. al registrarse, el usuario autoriza a cronos a enviar comunicaciones relacionadas con el servicio, incluyendo confirmaciones de reservación, recordatorios de eventos y actualizaciones de la plataforma.`
          },
          {
            title: "4. uso de la plataforma",
            content: `el usuario se compromete a utilizar cronos de manera responsable y conforme a la legislación aplicable. queda expresamente prohibido: utilizar la plataforma para fines ilegales o no autorizados; publicar contenido ofensivo, difamatorio o que viole derechos de terceros; intentar acceder sin autorización a sistemas o cuentas de otros usuarios; realizar actividades que interrumpan o deterioren el funcionamiento de la plataforma; utilizar bots, scrapers o cualquier herramienta automatizada para acceder al contenido; revender o comercializar el acceso a la plataforma sin autorización expresa de cronos; y cualquier otra actividad que cronos considere inapropiada a su discreción. cronos se reserva el derecho de eliminar contenido y suspender usuarios sin previo aviso cuando se detecte una violación de estas condiciones.`
          },
          {
            title: "5. reservaciones y cancelaciones",
            content: `las reservaciones realizadas a través de cronos están sujetas a disponibilidad y se confirman mediante un código qr único enviado al usuario. cada evento tiene un cupo máximo establecido por cronos y el establecimiento participante. las reservaciones se asignan por orden de llegada hasta agotar el cupo disponible. el usuario puede cancelar su reservación directamente desde la aplicación hasta 2 horas antes del inicio del evento. cancelaciones realizadas con menos de 2 horas de anticipación pueden estar sujetas a restricciones para futuras reservaciones. cronos no garantiza la disponibilidad de lugares en eventos con alta demanda. en caso de cancelación del evento por parte del establecimiento, cronos notificará a los usuarios registrados a la brevedad posible. cronos no se hace responsable por gastos de traslado, tiempo invertido u otros costos incurridos por el usuario en relación con un evento cancelado.`
          },
          {
            title: "6. consentimiento de grabación y uso de imagen",
            content: `al confirmar una reservación y asistir a cualquier evento organizado, coordinado o promovido por cronos, el usuario otorga a cronos su consentimiento expreso, libre, informado e irrevocable para ser grabado en video, fotografía y audio durante el transcurso del evento y en cualquier actividad relacionada con el mismo. este consentimiento incluye, sin limitarse a: la grabación de reacciones individuales y grupales durante los partidos, entrevistas informales, participación en trivias y quinielas, y cualquier otro momento que cronos considere relevante para la creación de contenido. el usuario autoriza a cronos a utilizar dicho material audiovisual —incluyendo su imagen, voz y likeness— en redes sociales (incluyendo tiktok, youtube, instagram, facebook y cualquier otra plataforma que cronos utilice o pueda utilizar en el futuro), campañas de marketing digital y tradicional, contenido promocional, material publicitario, presentaciones a inversores, cobertura periodística y cualquier otro uso comercial o no comercial que cronos determine conveniente, sin que ello genere para el usuario derecho a compensación económica, regalías o cualquier otro beneficio material. esta licencia es perpetua, mundial, no exclusiva, transferible y sublicenciable. cronos puede ceder estos derechos a terceros sin necesidad de notificación previa. el usuario que desee solicitar la eliminación de su imagen de materiales ya publicados podrá hacerlo enviando una solicitud escrita a hola@cronosports.app indicando su nombre completo, el evento al que asistió y una descripción del material que desea eliminar. cronos se compromete a responder dicha solicitud en un plazo máximo de 30 días hábiles, aunque la eliminación técnica de contenido en plataformas de terceros puede estar sujeta a los tiempos y políticas de cada plataforma.`
          },
          {
            title: "7. quinielas y actividades en eventos",
            content: `las quinielas y demás actividades de entretenimiento organizadas durante los eventos de cronos son actividades de participación voluntaria entre los asistentes presentes físicamente en el evento. cronos actúa únicamente como facilitador tecnológico para el registro y seguimiento de predicciones, sin intermediar en la recaudación, custodia o distribución de ningún fondo monetario. cualquier contribución económica asociada a las quinielas (como el pago de $5 usd por participante) se realiza directamente entre los participantes presentes, sin que cronos sea parte de dicha transacción. cronos no garantiza la exactitud en la determinación de ganadores ni se responsabiliza por disputas entre participantes relacionadas con los resultados de las quinielas. la participación en quinielas con dinero real puede estar regulada por las leyes locales; es responsabilidad exclusiva del usuario conocer y cumplir con la legislación aplicable en su jurisdicción.`
          },
          {
            title: "8. política de privacidad y datos",
            content: `cronos recopila y procesa datos personales de los usuarios con el único propósito de prestar el servicio descrito en estos términos. los datos recopilados incluyen: nombre completo, número de teléfono, equipo deportivo favorito, historial de reservaciones y participación en eventos. cronos no vende, arrienda ni comparte datos personales con terceros sin consentimiento del usuario, salvo en los casos requeridos por ley o necesarios para la prestación del servicio (como el envío de notificaciones sms a través de twilio). los datos se almacenan de forma segura en servidores de google firebase, sujetos a las políticas de seguridad y privacidad de dicho proveedor. el usuario puede solicitar la eliminación de sus datos personales en cualquier momento escribiendo a hola@cronosports.app. cronos se reserva el derecho de conservar ciertos datos por el tiempo requerido por obligaciones legales o para la resolución de disputas.`
          },
          {
            title: "9. propiedad intelectual",
            content: `todo el contenido de la plataforma cronos, incluyendo pero no limitado a: el nombre cronos, el logotipo, el diseño de la interfaz, el código fuente, los textos, las imágenes, los videos producidos por cronos y cualquier otro elemento distintivo, es propiedad exclusiva de cronos y está protegido por las leyes de propiedad intelectual aplicables. el usuario no adquiere ningún derecho de propiedad intelectual sobre la plataforma o su contenido por el hecho de utilizarla. queda expresamente prohibida la reproducción, distribución, modificación o uso comercial de cualquier elemento de cronos sin autorización escrita previa.`
          },
          {
            title: "10. limitación de responsabilidad",
            content: `cronos no será responsable por daños directos, indirectos, incidentales, especiales o consecuentes derivados del uso o imposibilidad de uso de la plataforma; de la cancelación o modificación de eventos por parte de los establecimientos participantes; de la calidad del servicio prestado por los restaurantes; de pérdidas económicas asociadas a las quinielas u otras actividades de entretenimiento; de interrupciones del servicio por mantenimiento, fallas técnicas o causas de fuerza mayor; ni de cualquier otro daño relacionado con el uso de la plataforma. en ningún caso la responsabilidad total de cronos hacia el usuario excederá el monto pagado por el usuario a cronos en los últimos 12 meses, o $100 usd en caso de que no haya mediado pago alguno.`
          },
          {
            title: "11. modificaciones al servicio",
            content: `cronos se reserva el derecho de modificar, suspender o discontinuar cualquier aspecto del servicio en cualquier momento y sin previo aviso. esto incluye la modificación de precios, funcionalidades, eventos disponibles y cualquier otro aspecto operativo de la plataforma. cronos no será responsable ante el usuario ni ante terceros por cualquier modificación, suspensión o discontinuación del servicio.`
          },
          {
            title: "12. ley aplicable y jurisdicción",
            content: `estos términos y condiciones se rigen por las leyes del estado de california, estados unidos de américa. cualquier disputa derivada de o relacionada con estos términos será sometida a la jurisdicción exclusiva de los tribunales competentes del condado de alameda, california. el usuario renuncia expresamente a cualquier otro fuero o jurisdicción que pudiera corresponderle.`
          },
          {
            title: "13. contacto",
            content: `para cualquier consulta, solicitud o reclamación relacionada con estos términos y condiciones, el usuario puede contactar a cronos a través de: correo electrónico: hola@cronosports.app. cronos se compromete a responder todas las comunicaciones en un plazo máximo de 5 días hábiles.`
          }
        ].map((section, i) => (
          <div key={i} style={{ background: "#0a1220", border: "1px solid #142035", borderRadius: "16px", padding: "20px 24px", marginBottom: "12px" }}>
            <h2 style={{ color: "#00c9ff", fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "12px" }}>{section.title}</h2>
            <p style={{ color: "#c8d8f0", fontSize: "14px", lineHeight: "1.8", margin: 0 }}>{section.content}</p>
          </div>
        ))}
      </div>
    </main>
  );
}