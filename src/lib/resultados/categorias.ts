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
