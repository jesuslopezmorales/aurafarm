import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection } from "@/components/LegalLayout";
import { LEGAL } from "@/lib/legal-info";

export const Route = createFileRoute("/terminos")({
  head: () => ({
    meta: [
      { title: `Términos de uso y reembolsos — ${LEGAL.appName}` },
      {
        name: "description",
        content: `Condiciones de uso, suscripciones y política de reembolso de ${LEGAL.appName}.`,
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalLayout title="Términos de uso y reembolsos">
      <LegalSection heading="1. Titular del servicio">
        <p>
          {LEGAL.appName} ({LEGAL.siteUrl}) es un servicio titularidad de {LEGAL.ownerName}.
        </p>
        {LEGAL.ownerTaxId ? <p>NIF: {LEGAL.ownerTaxId}</p> : null}
        {LEGAL.ownerAddress ? <p>Domicilio: {LEGAL.ownerAddress}</p> : null}
        <p>
          Contacto: <span className="font-medium text-foreground">{LEGAL.contactEmail}</span>
        </p>
      </LegalSection>

      <LegalSection heading="2. Aceptación y edad mínima">
        <p>
          Al crear una cuenta o usar {LEGAL.appName} aceptas estos términos y la política de
          privacidad. El servicio está dirigido a personas de 14 años o más. La contratación de
          suscripciones de pago requiere ser mayor de edad o contar con la autorización de quien
          ejerza la patria potestad o tutela.
        </p>
      </LegalSection>

      <LegalSection heading="3. Descripción del servicio">
        <p>
          {LEGAL.appName} es una aplicación de desarrollo personal gamificado: permite registrar
          hábitos, publicar «pruebas de Aura», votar las de otros usuarios, acumular Aura y rango,
          mantener rachas y hacer check-in en zonas.
        </p>
        <p>
          El Aura, los rangos y las rachas son elementos del juego. No tienen valor económico, no
          son canjeables por dinero y no constituyen un derecho de propiedad.
        </p>
        <p>
          {LEGAL.appName} no ofrece asesoramiento médico, psicológico ni profesional. No sustituye
          la atención de un profesional sanitario.
        </p>
      </LegalSection>

      <LegalSection heading="4. Cuenta de usuario">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Debes facilitar información veraz y mantener la confidencialidad de tu acceso.</li>
          <li>Eres responsable de la actividad realizada desde tu cuenta.</li>
          <li>Puedes solicitar la eliminación de tu cuenta escribiendo a {LEGAL.contactEmail}.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="5. Normas de uso y contenido">
        <p>Al usar {LEGAL.appName} te comprometes a no:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Publicar contenido ilegal, difamatorio, discriminatorio, violento o sexualmente explícito.</li>
          <li>Publicar datos personales de terceros ni contenido que vulnere derechos de otras personas.</li>
          <li>Suplantar la identidad de otros usuarios.</li>
          <li>
            Manipular el sistema de votos o de Aura, incluido el uso de cuentas múltiples o de
            medios automatizados.
          </li>
          <li>Intentar acceder sin autorización al servicio o a sus sistemas, o interferir en su funcionamiento.</li>
        </ul>
        <p>
          Conservas la titularidad del contenido que publicas. Nos concedes una licencia no
          exclusiva, gratuita y limitada para alojarlo y mostrarlo dentro de {LEGAL.appName} mientras
          esté publicado. Eres responsable de contar con los derechos necesarios sobre lo que
          publicas.
        </p>
        <p>
          Podemos retirar contenido y suspender o cancelar cuentas que incumplan estas normas. Para
          denunciar contenido, escribe a{" "}
          <span className="font-medium text-foreground">{LEGAL.reportsEmail}</span> indicando la
          publicación afectada.
        </p>
      </LegalSection>

      <LegalSection heading="6. Suscripciones de pago (Aura Pass y Aura Master)">
        <p>
          {LEGAL.appName} ofrece planes de suscripción de pago, Aura Pass y Aura Master, que
          proporcionan ventajas dentro de la app, como un multiplicador de Aura.
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            El precio, la moneda, los impuestos aplicables y la periodicidad del cobro se muestran
            en la pantalla de pago antes de confirmar la compra.
          </li>
          <li>
            Los pagos se procesan a través de Stripe. No almacenamos los datos de tu tarjeta.
          </li>
          <li>
            La suscripción se renueva automáticamente al final de cada periodo, salvo que la
            canceles antes de la renovación.
          </li>
          <li>
            Si modificamos el precio de un plan, te avisaremos con antelación razonable y el nuevo
            precio se aplicará a partir de la siguiente renovación.
          </li>
          <li>
            Si un pago falla o la suscripción finaliza, las ventajas del plan se desactivan y tu
            cuenta pasa al plan gratuito. No pierdes tu cuenta ni tu progreso.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="7. Cancelación">
        <p>
          Puedes cancelar tu suscripción en cualquier momento. La cancelación surte efecto al final
          del periodo ya pagado: mantienes las ventajas hasta esa fecha y no se realizan nuevos
          cobros.
        </p>
        <p>
          Para cancelar, escribe a{" "}
          <span className="font-medium text-foreground">{LEGAL.contactEmail}</span> desde el correo
          de tu cuenta. Cuando la app incorpore la gestión de suscripción, también podrás hacerlo
          desde ella.
        </p>
      </LegalSection>

      <LegalSection heading="8. Derecho de desistimiento y reembolsos">
        <p>
          Si eres consumidor, tienes derecho a desistir de la contratación de una suscripción en un
          plazo de 14 días naturales desde la fecha de contratación, sin necesidad de justificar tu
          decisión. En ese caso te reembolsaremos el importe íntegro pagado.
        </p>
        <p>
          Para ejercerlo, escribe a{" "}
          <span className="font-medium text-foreground">{LEGAL.contactEmail}</span> indicando el
          correo de tu cuenta y tu voluntad de desistir. Realizaremos el reembolso por el mismo medio
          de pago en un máximo de 14 días naturales desde que recibamos tu solicitud. El plazo en que
          el importe aparezca en tu cuenta depende de tu entidad bancaria.
        </p>
        <p>
          Transcurridos los 14 días, no se reembolsan los periodos ya iniciados, salvo que la ley lo
          exija o en caso de error de cobro o cobro duplicado, que corregiremos.
        </p>
      </LegalSection>

      <LegalSection heading="9. Disponibilidad y cambios en el servicio">
        <p>
          Trabajamos para mantener el servicio disponible, pero no garantizamos que funcione sin
          interrupciones ni errores. Podemos modificar, añadir o retirar funcionalidades. Si un
          cambio afecta de forma sustancial a una suscripción de pago vigente, podrás cancelarla y
          solicitar el reembolso proporcional del periodo no disfrutado.
        </p>
      </LegalSection>

      <LegalSection heading="10. Propiedad intelectual">
        <p>
          El nombre {LEGAL.appName}, su logotipo, el diseño y el software son titularidad de{" "}
          {LEGAL.ownerName} o de sus licenciantes. No se te concede ningún derecho sobre ellos más
          allá del uso personal del servicio conforme a estos términos.
        </p>
      </LegalSection>

      <LegalSection heading="11. Responsabilidad">
        <p>
          El servicio se presta tal cual. En la medida permitida por la ley, no respondemos de daños
          indirectos derivados del uso o la imposibilidad de uso de {LEGAL.appName}, ni del contenido
          publicado por otros usuarios. Nada en estos términos limita los derechos que la normativa
          de consumidores te reconoce ni la responsabilidad que no pueda excluirse por ley.
        </p>
      </LegalSection>

      <LegalSection heading="12. Modificación de los términos">
        <p>
          Podemos actualizar estos términos. La fecha de la última actualización figura al inicio de
          esta página. Si el cambio es relevante, te lo comunicaremos por la app o por correo. El uso
          continuado del servicio tras la modificación implica su aceptación.
        </p>
      </LegalSection>

      <LegalSection heading="13. Legislación aplicable">
        <p>
          Estos términos se rigen por la legislación española. Si eres consumidor, podrás acudir a
          los juzgados y tribunales de tu domicilio, sin perjuicio de los derechos que te reconozca
          la normativa de protección de consumidores de tu país de residencia.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}