import { Resend } from "resend";
import { formatearPrecio, formatearFecha } from "@/lib/format";

const FROM = process.env.RESEND_FROM_EMAIL || "AJAG Golf <onboarding@resend.dev>";

function obtenerCliente(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY no configurada: no se envían emails de inscripción.");
    return null;
  }
  return new Resend(apiKey);
}

type ItemInscripcion = { torneoNombre: string; torneoFecha: string; precioCents: number };

function envoltorio(titulo: string, cuerpoHtml: string): string {
  return `
    <div style="font-family: system-ui, sans-serif; background: #f3f6f3; padding: 32px 16px;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e9e4;">
        <div style="background: #1f4d33; padding: 20px 24px;">
          <span style="color: #ffffff; font-size: 18px; font-weight: 600;">AJAG Golf</span>
        </div>
        <div style="padding: 24px;">
          <h1 style="margin: 0 0 12px; font-size: 18px; color: #1f4d33;">${titulo}</h1>
          ${cuerpoHtml}
        </div>
      </div>
    </div>
  `;
}

function listaItems(items: ItemInscripcion[]): string {
  const filas = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 0; color: #1f4d33; font-size: 14px;">
            ${item.torneoNombre}<br />
            <span style="color: #6b7a6f; font-size: 12px;">${formatearFecha(item.torneoFecha)}</span>
          </td>
          <td style="padding: 8px 0; text-align: right; color: #1f4d33; font-size: 14px; font-weight: 600;">
            ${formatearPrecio(item.precioCents)}
          </td>
        </tr>
      `,
    )
    .join("");
  const total = items.reduce((acc, i) => acc + i.precioCents, 0);
  return `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      ${filas}
      <tr>
        <td style="padding: 10px 0 0; border-top: 1px solid #e4e9e4; font-size: 14px; font-weight: 600; color: #1f4d33;">Total</td>
        <td style="padding: 10px 0 0; border-top: 1px solid #e4e9e4; text-align: right; font-size: 14px; font-weight: 600; color: #1f4d33;">
          ${formatearPrecio(total)}
        </td>
      </tr>
    </table>
  `;
}

export async function enviarEmailInscripcionRecibida(args: {
  destinatario: string;
  nombre: string;
  items: ItemInscripcion[];
}) {
  const resend = obtenerCliente();
  if (!resend) return;

  const asunto =
    args.items.length === 1
      ? `Hemos recibido tu inscripción a ${args.items[0].torneoNombre}`
      : "Hemos recibido tus inscripciones";

  const html = envoltorio(
    "Inscripción recibida",
    `
      <p style="color: #1f4d33; font-size: 14px; line-height: 1.5;">Hola ${args.nombre},</p>
      <p style="color: #1f4d33; font-size: 14px; line-height: 1.5;">
        Hemos recibido tu inscripción, pero <strong>todavía no es válida</strong>:
        queda pendiente de que confirmemos tu pago. En cuanto lo hagamos,
        recibirás un email de confirmación y tu plaza quedará en firme.
      </p>
      ${listaItems(args.items)}
      <p style="color: #6b7a6f; font-size: 13px; line-height: 1.5;">
        Si crees que esto es un error o tienes dudas, escríbenos desde la
        página de contacto de la web.
      </p>
    `,
  );

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: args.destinatario,
      subject: asunto,
      html,
    });
    if (error) console.error("Error enviando email de inscripción recibida:", error);
  } catch (err) {
    console.error("Error inesperado enviando email de inscripción recibida:", err);
  }
}

export async function enviarEmailInscripcionConfirmada(args: {
  destinatario: string;
  nombre: string;
  items: ItemInscripcion[];
}) {
  const resend = obtenerCliente();
  if (!resend) return;

  const asunto =
    args.items.length === 1
      ? `Tu inscripción a ${args.items[0].torneoNombre} está confirmada`
      : "Tus inscripciones están confirmadas";

  const html = envoltorio(
    "¡Inscripción confirmada!",
    `
      <p style="color: #1f4d33; font-size: 14px; line-height: 1.5;">Hola ${args.nombre},</p>
      <p style="color: #1f4d33; font-size: 14px; line-height: 1.5;">
        Hemos confirmado tu pago: tu plaza ya está en firme. ¡Nos vemos en
        el campo!
      </p>
      ${listaItems(args.items)}
    `,
  );

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: args.destinatario,
      subject: asunto,
      html,
    });
    if (error) console.error("Error enviando email de inscripción confirmada:", error);
  } catch (err) {
    console.error("Error inesperado enviando email de inscripción confirmada:", err);
  }
}
