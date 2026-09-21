import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection } from "@/components/LegalLayout";
import { LEGAL } from "@/lib/legal-info";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: `Política de privacidad — ${LEGAL.appName}` },
      {
        name: "description",
        content: `Cómo ${LEGAL.appName} trata tus datos personales.`,
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalLayout title="Política de privacidad">
      <LegalSection heading="1. Responsable del tratamiento">
        <p>
          El responsable del tratamiento de tus datos personales es {LEGAL.ownerName}, titular de{" "}
          {LEGAL.appName} ({LEGAL.siteUrl}).
        </p>
        {LEGAL.ownerTaxId ? <p>NIF: {LEGAL.ownerTaxId}</p> : null}
        {LEGAL.ownerAddress ? <p>Domicilio: {LEGAL.ownerAddress}</p> : null}
        <p>
          Contacto para cuestiones de privacidad:{" "}
          <span className="font-medium text-foreground">{LEGAL.contactEmail}</span>
        </p>
      </LegalSection>

      <LegalSection heading="2. Datos que tratamos">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Datos de cuenta: correo electrónico y contraseña (almacenada de forma cifrada). Si
            accedes con Google, recibimos tu correo y los datos básicos de perfil que Google
            comparte.
          </li>
          <li>Datos de perfil: nombre, avatar y biografía que decidas introducir.</li>
          <li>
            Actividad en la app: hábitos y sus registros, Aura, racha, rango, publicaciones
            («pruebas de Aura»), votos y check-ins en zonas.
          </li>
          <li>Ubicación: únicamente si autorizas el permiso de tu dispositivo (apartado 4).</li>
          <li>
            Datos de suscripción: identificador de cliente de Stripe y estado de tu plan (Aura Pass
            o Aura Master). Los datos de tu tarjeta los procesa Stripe y no llegan a nuestros
            servidores.
          </li>
          <li>
            Datos técnicos: dirección IP y datos de conexión que los proveedores de alojamiento
            registran automáticamente por motivos de seguridad y funcionamiento.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. Finalidades y base jurídica">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Crear y gestionar tu cuenta y prestarte el servicio: ejecución del contrato.
          </li>
          <li>
            Gestionar suscripciones y pagos: ejecución del contrato. Cumplir obligaciones fiscales y
            contables: obligación legal.
          </li>
          <li>
            Comprobar tu proximidad a una zona en los check-ins: tu consentimiento, otorgado
            mediante el permiso de ubicación de tu dispositivo.
          </li>
          <li>
            Mantener la seguridad del servicio, prevenir abusos y moderar contenido: interés
            legítimo.
          </li>
          <li>Atender tus consultas y solicitudes: interés legítimo y obligación legal.</li>
        </ul>
        <p>No vendemos tus datos personales.</p>
      </LegalSection>

      <LegalSection heading="4. Ubicación">
        <p>
          Cuando usas funciones de la sección Zonas, la app solicita a tu navegador o dispositivo
          acceso a tu ubicación. Solo se accede a ella si concedes el permiso, y puedes revocarlo en
          cualquier momento desde los ajustes del navegador o del sistema. Se utiliza para comprobar
          tu proximidad a una zona y registrar tu check-in asociado a tu cuenta.
        </p>
      </LegalSection>

      <LegalSection heading="5. Contenido público">
        <p>
          Las publicaciones que envías al feed son visibles para otros usuarios junto con tu nombre
          de perfil y tu avatar. Tus votos individuales no son visibles para otros usuarios; solo se
          muestran los recuentos agregados.
        </p>
      </LegalSection>

      <LegalSection heading="6. Asistentes de IA conectados">
        <p>
          Si conectas un asistente de IA a tu cuenta desde la sección Conectar, autorizas a ese
          servicio a acceder a los datos de tu cuenta con los permisos que concedas. El tratamiento
          que ese servicio haga de los datos después de acceder a ellos se rige por su propia
          política de privacidad.
        </p>
      </LegalSection>

      <LegalSection heading="7. Proveedores y destinatarios">
        <p>Para prestar el servicio utilizamos los siguientes proveedores:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Supabase, a través de Lovable Cloud: base de datos y autenticación.</li>
          <li>Vercel: alojamiento de la aplicación.</li>
          <li>Stripe: procesamiento de pagos y suscripciones.</li>
          <li>
            Google: inicio de sesión con Google y fuentes tipográficas (Google Fonts). Al cargar la
            app, tu navegador se conecta a servidores de Google para descargar las fuentes.
          </li>
        </ul>
        <p>
          Estos proveedores actúan como encargados del tratamiento, salvo Stripe y Google, que
          pueden actuar como responsables independientes para sus propias finalidades. Algunos
          tratan datos fuera del Espacio Económico Europeo; en esos casos se apoyan en garantías
          adecuadas, como decisiones de adecuación o cláusulas contractuales tipo.
        </p>
      </LegalSection>

      <LegalSection heading="8. Conservación">
        <p>
          Conservamos tus datos mientras mantengas tu cuenta activa. Si solicitas la supresión de tu
          cuenta, eliminaremos tus datos, salvo aquellos que debamos conservar bloqueados durante
          los plazos legales, como los datos de facturación y pagos.
        </p>
      </LegalSection>

      <LegalSection heading="9. Tus derechos">
        <p>
          Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación del
          tratamiento y portabilidad escribiendo a{" "}
          <span className="font-medium text-foreground">{LEGAL.contactEmail}</span>. Responderemos en
          el plazo máximo de un mes.
        </p>
        <p>
          Si consideras que tus derechos no han sido atendidos, puedes presentar una reclamación
          ante la Agencia Española de Protección de Datos (www.aepd.es).
        </p>
      </LegalSection>

      <LegalSection heading="10. Edad mínima">
        <p>
          {LEGAL.appName} está dirigida a personas de 14 años o más. La contratación de
          suscripciones de pago requiere ser mayor de edad o contar con la autorización de quien
          ejerza la patria potestad o tutela.
        </p>
      </LegalSection>

      <LegalSection heading="11. Almacenamiento local y publicidad">
        <p>
          {LEGAL.appName} utiliza el almacenamiento local del navegador y, en su caso, cookies
          técnicas estrictamente necesarias para mantener tu sesión iniciada y recordar tus
          preferencias. Estas tecnologías no requieren consentimiento. La app no incluye
          publicidad. Si en el futuro incorporamos analítica u otras tecnologías que lo requieran,
          actualizaremos esta política y solicitaremos tu consentimiento cuando sea necesario.
        </p>
      </LegalSection>

      <LegalSection heading="12. Cambios en esta política">
        <p>
          Podemos actualizar esta política para reflejar cambios en el servicio o en la normativa.
          La fecha de la última actualización figura al inicio de esta página.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}