import "server-only";
import type { PremioCategoria } from "@/types/database";

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
