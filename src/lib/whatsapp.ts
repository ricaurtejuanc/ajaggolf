import { formatearFecha, formatearPrecio } from "@/lib/format";
import type { Torneo } from "@/types/database";

/**
 * Mensaje de difusión de un torneo publicado, listo para wa.me: el
 * organizador elige a mano a qué grupo/comunidad enviarlo (WhatsApp
 * Business API no permite publicar en grupos, solo conversaciones 1:1 con
 * plantillas aprobadas — este es el único camino que no viola sus
 * términos de uso y no exige darse de alta en nada).
 */
export function construirMensajeWhatsapp(torneo: Torneo, urlFicha: string): string {
  const lineas = [
    `🏌️ *${torneo.nombre}*`,
    "",
    `📅 ${formatearFecha(torneo.fecha)}`,
    `📍 ${torneo.campo_golf}${torneo.recorrido ? ` — ${torneo.recorrido}` : ""}`,
    `💰 ${formatearPrecio(torneo.precio_cents)}${
      torneo.precio_socio_cents != null
        ? ` (socios: ${formatearPrecio(torneo.precio_socio_cents)})`
        : ""
    }`,
  ];
  if (torneo.cupo_maximo != null) {
    lineas.push(`🎟️ Cupo: ${torneo.cupo_maximo} plazas`);
  }
  lineas.push("", `👉 Toda la info e inscripción: ${urlFicha}`);
  return lineas.join("\n");
}

export function urlCompartirWhatsapp(mensaje: string): string {
  return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
}
