import "server-only";
import type { PremioCategoria, PremioHoyo } from "@/types/database";

/**
 * Lee y sanea la estructura de premios (categorías + lista de premios de
 * cada una) desde un campo de formulario "premios" con JSON serializado.
 * Comparten esta lógica el formulario de torneo (define la estructura) y
 * el Cuadro de Honor en Resultados (puede añadir premios nuevos sin volver
 * al formulario de torneo).
 */
export function leerPremiosDesdeFormData(formData: FormData): PremioCategoria[] {
  let crudo: unknown;
  try {
    crudo = JSON.parse(String(formData.get("premios") ?? "[]"));
  } catch {
    return [];
  }
  if (!Array.isArray(crudo)) return [];

  return crudo
    .map((cat) => {
      if (typeof cat !== "object" || cat === null) return null;
      const nombre = String((cat as { nombre?: unknown }).nombre ?? "").trim();
      const premiosCrudo = (cat as { premios?: unknown }).premios;
      if (!nombre || !Array.isArray(premiosCrudo)) return null;
      const premios = premiosCrudo
        .map((p) => String(p ?? "").trim())
        .filter((p): p is string => p.length > 0);
      if (premios.length === 0) return null;
      const categoriaUnica = (cat as { categoria_unica?: unknown }).categoria_unica === true;
      const desde = Number((cat as { handicap_desde?: unknown }).handicap_desde);
      const hasta = Number((cat as { handicap_hasta?: unknown }).handicap_hasta);
      return {
        nombre,
        categoria_unica: categoriaUnica,
        handicap_desde: categoriaUnica || !Number.isFinite(desde) ? null : desde,
        handicap_hasta: categoriaUnica || !Number.isFinite(hasta) ? null : hasta,
        premios,
      };
    })
    .filter((c): c is PremioCategoria => c != null);
}

/**
 * Igual que leerPremiosDesdeFormData pero para "premios_hoyo" (drive más
 * largo, bola más cercana...): sin categoría de hándicap, con un número de
 * hoyo opcional propio.
 */
export function leerPremiosHoyoDesdeFormData(formData: FormData): PremioHoyo[] {
  let crudo: unknown;
  try {
    crudo = JSON.parse(String(formData.get("premios_hoyo") ?? "[]"));
  } catch {
    return [];
  }
  if (!Array.isArray(crudo)) return [];

  return crudo
    .map((p) => {
      if (typeof p !== "object" || p === null) return null;
      const nombre = String((p as { nombre?: unknown }).nombre ?? "").trim();
      if (!nombre) return null;
      const hoyo = Number((p as { hoyo?: unknown }).hoyo);
      return { nombre, hoyo: Number.isFinite(hoyo) && hoyo >= 1 && hoyo <= 18 ? hoyo : null };
    })
    .filter((p): p is PremioHoyo => p != null);
}
