import type { TipoMovimiento } from "@/types/database";

/**
 * Catálogo de categorías de movimiento. Vive en TypeScript y no como enum de
 * Postgres a propósito: añadir una categoría es una línea aquí, sin migración.
 * `movimientos_economicos.categoria` guarda la clave; si algún día se retira
 * una categoría, los movimientos antiguos siguen leyéndose (ver
 * `etiquetaCategoria`, que cae al propio valor guardado si no la reconoce).
 */
export const CATEGORIAS: Record<TipoMovimiento, { valor: string; etiqueta: string }[]> = {
  ingreso: [
    { valor: "inscripciones_externas", etiqueta: "Inscripciones cobradas aparte" },
    { valor: "patrocinio", etiqueta: "Patrocinio" },
    { valor: "cuotas", etiqueta: "Cuotas de socio" },
    { valor: "otros", etiqueta: "Otros ingresos" },
  ],
  gasto: [
    { valor: "campo", etiqueta: "Pago al club / green fees" },
    { valor: "regalos", etiqueta: "Regalos y trofeos" },
    { valor: "catering", etiqueta: "Catering y cóctel" },
    { valor: "material", etiqueta: "Material y señalización" },
    { valor: "otros", etiqueta: "Otros gastos" },
  ],
};

export function etiquetaCategoria(tipo: TipoMovimiento, valor: string): string {
  return CATEGORIAS[tipo].find((c) => c.valor === valor)?.etiqueta ?? valor;
}

/** Valida que la categoría exista dentro del tipo, para no guardar basura. */
export function esCategoriaValida(tipo: TipoMovimiento, valor: string): boolean {
  return CATEGORIAS[tipo].some((c) => c.valor === valor);
}
