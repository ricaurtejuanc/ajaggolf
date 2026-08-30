import type { CategoriaClasificacionPdf } from "@/types/database";

/**
 * Categorías con las que un admin puede etiquetar cada PDF/foto de
 * clasificación que sube. Un torneo puede tener un documento por categoría
 * (o solo uno con "Categoría única" si no las separa), y el público las
 * cambia con un selector en la página de clasificación.
 */
export const CATEGORIAS_CLASIFICACION_PDF = [
  "primera",
  "segunda",
  "senior",
  "damas",
  "scratch",
  "unica",
] as const satisfies readonly CategoriaClasificacionPdf[];

export const etiquetaCategoriaClasificacion: Record<CategoriaClasificacionPdf, string> = {
  primera: "Primera Categoría",
  segunda: "Segunda Categoría",
  senior: "Senior",
  damas: "Damas",
  scratch: "Scratch",
  unica: "Categoría Única",
};

export function esCategoriaClasificacion(valor: unknown): valor is CategoriaClasificacionPdf {
  return (
    typeof valor === "string" &&
    (CATEGORIAS_CLASIFICACION_PDF as readonly string[]).includes(valor)
  );
}

/**
 * Orden de presentación fijo (el del array), no alfabético ni por fecha de
 * subida: es el que espera el usuario al ver las pestañas/selector.
 */
export function ordenCategoriaClasificacion(categoria: CategoriaClasificacionPdf): number {
  return CATEGORIAS_CLASIFICACION_PDF.indexOf(categoria);
}

/**
 * Adivina la categoría de publicación (la lista fija de arriba) para un
 * hándicap dado, a partir de los tramos de premios del torneo (libres,
 * definidos por el admin). Solo se usa como valor de partida al crear o
 * cargar filas en la tabla manual de resultados; el admin siempre puede
 * cambiarlo fila a fila.
 *
 * Solo se adivina cuando el nombre de la categoría de premios lo dice
 * explícitamente ("Damas", "Senior", "Scratch", "Primera", "Segunda"...). En
 * la práctica el nombre casi nunca es literal (suele ser "Categoría 1",
 * "Hasta 12"...), así que sin una palabra clave clara el resultado es
 * "unica": es mejor dejarlo sin dividir y que el admin lo reparta a mano
 * fila a fila que arriesgarse a adivinar mal qué tramo es Primera y cuál
 * Segunda.
 */
export function adivinarCategoriaPublicacion(
  handicap: number | null,
  categoriasPremios: { nombre: string; handicapDesde: number | null; handicapHasta: number | null }[],
): CategoriaClasificacionPdf {
  if (handicap == null || Number.isNaN(handicap)) return "unica";
  const conRango = categoriasPremios.filter(
    (c) => c.handicapDesde != null || c.handicapHasta != null,
  );
  if (conRango.length === 0) return "unica";

  const exacta = conRango.find(
    (c) =>
      (c.handicapDesde == null || handicap >= c.handicapDesde) &&
      (c.handicapHasta == null || handicap <= c.handicapHasta),
  );

  let categoria = exacta;
  if (!categoria) {
    // Ningún tramo cubre este hándicap (hueco entre categorías, o por
    // encima/debajo de todas): se asigna al más cercano en vez de dejarlo
    // sin adivinar.
    let distanciaMinima = Infinity;
    for (const c of conRango) {
      const distDesde = c.handicapDesde != null ? Math.abs(handicap - c.handicapDesde) : Infinity;
      const distHasta = c.handicapHasta != null ? Math.abs(handicap - c.handicapHasta) : Infinity;
      const distancia = Math.min(distDesde, distHasta);
      if (distancia < distanciaMinima) {
        distanciaMinima = distancia;
        categoria = c;
      }
    }
  }
  if (!categoria) return "unica";

  const nombre = categoria.nombre.toLowerCase();
  if (nombre.includes("dama")) return "damas";
  if (nombre.includes("senior") || nombre.includes("sénior") || nombre.includes("veterano"))
    return "senior";
  if (nombre.includes("scratch")) return "scratch";
  if (nombre.includes("segunda")) return "segunda";
  if (nombre.includes("primera")) return "primera";

  return "unica";
}
