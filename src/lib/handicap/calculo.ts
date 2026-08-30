/**
 * Cálculo de hándicap según el World Handicap System (WHS/RFEG).
 *
 * Portado desde la calculadora de aftergolf.es para que viva aquí sin
 * depender de aquel sitio: son funciones puras, sin estado ni red, así que
 * la misma entrada da siempre el mismo resultado y se pueden usar igual en
 * servidor que en cliente.
 */

/** Modalidades de juego y el porcentaje de hándicap que aplica cada una. */
export const MODALIDADES = [
  { valor: 1, etiqueta: "Individual stroke play (100%)" },
  { valor: 0.95, etiqueta: "Individual match play (95%)" },
  { valor: 0.9, etiqueta: "Four-ball stroke play (90%)" },
  { valor: 0.85, etiqueta: "Four-ball match play (85%)" },
] as const;

export type Tee = {
  /** Course Rating del tee. */
  cr: number;
  /** Slope Rating del tee (113 = campo de dificultad media). */
  slope: number;
  par: number;
};

/**
 * ANTES DE JUGAR — Hándicap de juego (Course Handicap).
 *
 *   HC = (Slope / 113 × HI + (CR − Par)) × modalidad
 *
 * El 113 es el slope de un campo de dificultad media: la fracción escala el
 * hándicap del jugador a lo difícil que es este tee en concreto, y (CR − Par)
 * corrige que el campo se juegue por encima o por debajo de su par.
 */
export function handicapDeJuego({
  handicapIndex,
  tee,
  modalidad = 1,
}: {
  handicapIndex: number;
  tee: Tee;
  modalidad?: number;
}): { exacto: number; handicapJuego: number } {
  const exacto = ((tee.slope / 113) * handicapIndex + (tee.cr - tee.par)) * modalidad;
  return { exacto, handicapJuego: Math.round(exacto) };
}

/**
 * DESPUÉS DE JUGAR — Resultado neto, Stableford y Score Differential.
 *
 *   Neto        = Bruto − golpes recibidos
 *   Stableford  = 36 − (Neto − Par)
 *   Differential = (113 / Slope) × (Bruto − CR − PCC)
 *
 * El PCC (Playing Conditions Calculation) es el ajuste por condiciones del
 * día que publica el club: normalmente 0, y entre −1 y +3 cuando lo hay.
 *
 * El differential es lo que de verdad entra en el hándicap del jugador: la
 * federación promedia los 8 mejores de sus últimas 20 rondas. Por eso se
 * redondea a un decimal, como se registra oficialmente.
 */
export function resultadoDeRonda({
  handicapJuego,
  bruto,
  tee,
  pcc = 0,
}: {
  handicapJuego: number;
  /** Resultado bruto Stableford (con tope de doble bogey por hoyo). */
  bruto: number;
  tee: Tee;
  pcc?: number;
}): {
  golpesRecibidos: number;
  neto: number;
  puntosStableford: number;
  differential: number;
} {
  const golpesRecibidos = handicapJuego;
  const neto = bruto - golpesRecibidos;
  return {
    golpesRecibidos,
    neto,
    puntosStableford: 36 - (neto - tee.par),
    differential: Math.round(((113 / tee.slope) * (bruto - tee.cr - pcc)) * 10) / 10,
  };
}

/**
 * Golpes que recibe un jugador en un hoyo concreto, según el índice de
 * hándicap del hoyo (1 = el más difícil, 18 = el más fácil).
 *
 * Se reparten dando una vuelta completa por hoyo y luego un golpe extra a
 * los hoyos más difíciles hasta agotar el resto: con hándicap 22 son 1 golpe
 * en los 18 hoyos y uno más en los de índice 1 a 4.
 */
export function golpesEnHoyo(handicapJuego: number, indiceHoyo: number): number {
  return Math.floor(handicapJuego / 18) + (indiceHoyo <= handicapJuego % 18 ? 1 : 0);
}
