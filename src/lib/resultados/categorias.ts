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
 * Adivina la categoría de publicación (la lista fija de arriba) a partir del
 * nombre de una categoría de premios del torneo (libre, definida por el
 * admin: "Caballeros hasta 12", "Damas", "Scratch"...). Solo se usa como
 * valor de partida al crear filas nuevas en la tabla manual de resultados;
 * el admin siempre puede cambiarlo fila a fila. Sin ninguna coincidencia de
 * palabra clave, "unica" es la opción segura: nunca deja a un jugador fuera
 * de la clasificación general por una categoría mal adivinada.
 */
/**
 * Categoría de premios del torneo (nombre libre, definido por el admin) a la
 * que pertenece un hándicap dado, por rango. Sin tramos configurados o sin
 * hándicap conocido, devuelve null (no hay premios por categoría en este
 * torneo, o el jugador aún no tiene hándicap). Sin ningún tramo que cubra el
 * hándicap exactamente, se asigna al tramo más cercano: un hueco entre
 * categorías, o un valor fuera de todas, no debe dejar a nadie sin adivinar.
 */
export function categoriaPremiosPorHandicap(
  handicap: number | null,
  categorias: { nombre: string; handicapDesde: number | null; handicapHasta: number | null }[],
): string | null {
  if (handicap == null || Number.isNaN(handicap)) return null;
  const conRango = categorias.filter((c) => c.handicapDesde != null || c.handicapHasta != null);
  if (conRango.length === 0) return null;

  const exacta = conRango.find(
    (c) =>
      (c.handicapDesde == null || handicap >= c.handicapDesde) &&
      (c.handicapHasta == null || handicap <= c.handicapHasta),
  );
  if (exacta) return exacta.nombre;

  let masCercana = conRango[0];
  let distanciaMinima = Infinity;
  for (const c of conRango) {
    const distDesde = c.handicapDesde != null ? Math.abs(handicap - c.handicapDesde) : Infinity;
    const distHasta = c.handicapHasta != null ? Math.abs(handicap - c.handicapHasta) : Infinity;
    const distancia = Math.min(distDesde, distHasta);
    if (distancia < distanciaMinima) {
      distanciaMinima = distancia;
      masCercana = c;
    }
  }
  return masCercana.nombre;
}

export function adivinarCategoriaClasificacion(nombreCategoriaPremios: string): CategoriaClasificacionPdf {
  const nombre = nombreCategoriaPremios.toLowerCase();
  if (nombre.includes("dama")) return "damas";
  if (nombre.includes("senior") || nombre.includes("sénior") || nombre.includes("veterano"))
    return "senior";
  if (nombre.includes("scratch")) return "scratch";
  if (nombre.includes("segunda")) return "segunda";
  if (nombre.includes("primera")) return "primera";
  return "unica";
}
