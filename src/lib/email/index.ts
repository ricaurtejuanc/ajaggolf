import nodemailer from "nodemailer";
import { formatearPrecio, formatearFecha } from "@/lib/format";
import type { OrganizadorEmailInfo } from "@/lib/data/organizador";

const MARCA_DEFECTO = "AJAG Golf";
const FROM_DEFECTO = process.env.SMTP_FROM || "AJAG Golf <no-reply@localhost>";

// Solo se personaliza el nombre visible del remitente (y a quién se
// responde): la dirección real de envío es siempre la de la cuenta SMTP
// configurada (SMTP_FROM), porque la mayoría de proveedores rechazan o
// marcan como spam un remitente de un dominio no verificado en esa
// cuenta. "<user@dominio>" -> "user@dominio"; si no hay "<...>" se asume
// que SMTP_FROM ya es solo la dirección.
const DIRECCION_ENVIO = (FROM_DEFECTO.match(/<([^>]+)>/)?.[1] ?? FROM_DEFECTO).trim();

function remitente(organizador?: OrganizadorEmailInfo | null): string {
  return `${organizador?.nombre ?? MARCA_DEFECTO} <${DIRECCION_ENVIO}>`;
}

function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function obtenerTransporte() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !port || !user || !pass) {
    console.error(
      "SMTP no configurado (faltan SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD): no se envían emails de inscripción.",
    );
    return null;
  }
  const puerto = Number(port);
  return nodemailer.createTransport({
    host,
    port: puerto,
    secure: puerto === 465, // 465 = SSL implícito; 587/25 = STARTTLS
    auth: { user, pass },
  });
}

/** Devuelve true si el email se ha enviado, false si no (SMTP sin
 * configurar o fallo al enviar) para que quien llame pueda avisar de que
 * el envío no ha ocurrido en vez de darlo por hecho en silencio. */
async function enviar(
  destinatario: string,
  asunto: string,
  html: string,
  organizador?: OrganizadorEmailInfo | null,
): Promise<boolean> {
  const transporte = obtenerTransporte();
  if (!transporte) return false;
  try {
    await transporte.sendMail({
      from: remitente(organizador),
      to: destinatario,
      replyTo: organizador?.email_contacto ?? undefined,
      subject: asunto,
      html,
    });
    return true;
  } catch (err) {
    console.error("Error enviando email:", err);
    return false;
  }
}

type ItemInscripcion = { torneoNombre: string; torneoFecha: string; precioCents: number };

function envoltorio(
  titulo: string,
  cuerpoHtml: string,
  organizador?: OrganizadorEmailInfo | null,
): string {
  const marca = organizador?.nombre ?? MARCA_DEFECTO;
  return `
    <div style="font-family: system-ui, sans-serif; background: #f3f6f3; padding: 32px 16px;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e9e4;">
        <div style="background: #1f4d33; padding: 20px 24px;">
          <span style="color: #ffffff; font-size: 18px; font-weight: 600;">${escapeHtml(marca)}</span>
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
  organizador?: OrganizadorEmailInfo | null;
}) {
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
    args.organizador,
  );

  return await enviar(args.destinatario, asunto, html, args.organizador);
}

export async function enviarEmailNuevaConsulta(args: {
  nombre: string;
  email: string;
  telefono: string | null;
  mensaje: string;
  destinatario?: string;
  organizador?: OrganizadorEmailInfo | null;
}) {
  const html = envoltorio(
    "Nueva consulta de contacto",
    `
      <p style="color: #1f4d33; font-size: 14px; line-height: 1.5;">
        <strong>${escapeHtml(args.nombre)}</strong> (${escapeHtml(args.email)}${args.telefono ? ` · ${escapeHtml(args.telefono)}` : ""})
        ha escrito desde el formulario de contacto:
      </p>
      <p style="color: #1f4d33; font-size: 14px; line-height: 1.5; white-space: pre-line; background: #f3f6f3; border-radius: 8px; padding: 12px;">${escapeHtml(args.mensaje)}</p>
    `,
    args.organizador,
  );

  const destinatario = args.destinatario ?? args.organizador?.email_contacto ?? "info@aftergolf.es";
  return await enviar(destinatario, `Nueva consulta de ${args.nombre}`, html, args.organizador);
}

export async function enviarEmailRespuestaConsulta(args: {
  destinatario: string;
  nombre: string;
  mensajeOriginal: string;
  respuesta: string;
  organizador?: OrganizadorEmailInfo | null;
}) {
  const html = envoltorio(
    "Respuesta a tu consulta",
    `
      <p style="color: #1f4d33; font-size: 14px; line-height: 1.5;">Hola ${escapeHtml(args.nombre)},</p>
      <p style="color: #1f4d33; font-size: 14px; line-height: 1.5; white-space: pre-line;">${escapeHtml(args.respuesta)}</p>
      <p style="color: #6b7a6f; font-size: 12px; line-height: 1.5; margin-top: 20px; border-top: 1px solid #e4e9e4; padding-top: 12px;">
        Tu mensaje original: "${escapeHtml(args.mensajeOriginal)}"
      </p>
    `,
    args.organizador,
  );

  const marca = args.organizador?.nombre ?? MARCA_DEFECTO;
  return await enviar(
    args.destinatario,
    `Respuesta a tu consulta — ${marca}`,
    html,
    args.organizador,
  );
}

export async function enviarEmailInscripcionConfirmada(args: {
  destinatario: string;
  nombre: string;
  items: ItemInscripcion[];
  organizador?: OrganizadorEmailInfo | null;
}) {
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
    args.organizador,
  );

  return await enviar(args.destinatario, asunto, html, args.organizador);
}
