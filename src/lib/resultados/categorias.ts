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
 * En la práctica el nombre de la categoría de premios casi nunca es
 * literalmente "Primera"/"Segunda"/etc. (suele ser "Categoría 1", "Hasta 12",
 * "Otros"...), así que primero se prueba por palabra clave en el nombre y,
 * si no hay ninguna, con exactamente dos tramos de hándicap se asume la
 * convención española habitual: el tramo de hándicap más bajo es "Primera"
 * y el más alto "Segunda". Sin tramos configurados, sin hándicap conocido, o
 * con una forma de premios que no encaja en ningún caso anterior, "unica" es
 * la opción segura: nunca deja a un jugador fuera de la clasificación
 * general por una categoría mal adivinada.
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

  if (conRango.length === 2) {
    const ordenadas = [...conRango].sort(
      (a, b) => (a.handicapDesde ?? -Infinity) - (b.handicapDesde ?? -Infinity),
    );
    return categoria === ordenadas[0] ? "primera" : "segunda";
  }

  return "unica";
}
