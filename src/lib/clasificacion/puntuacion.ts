export type ModoPuntuacionLiga = "tabla_puntos" | "suma_stableford" | "suma_medal_handicap";

export interface ResultadoParaPuntuar {
  posicion: number | null;
  puntos: number | null;
  golpes: number | null;
  handicap: number | null;
}

/**
 * Valor que aporta un resultado de un torneo a la clasificación de la liga,
 * según su modo_puntuacion. Null si el resultado no cuenta (sin puntuación
 * real todavía: retirado, no presentado, pendiente...).
 */
export function calcularPuntosPorTorneo(
  modoPuntuacion: ModoPuntuacionLiga,
  tablaPuntos: Record<string, number>,
  resultado: ResultadoParaPuntuar,
): number | null {
  if (modoPuntuacion === "suma_stableford") {
    return resultado.puntos;
  }
  if (modoPuntuacion === "suma_medal_handicap") {
    if (resultado.golpes == null) return null;
    return resultado.golpes - (resultado.handicap ?? 0);
  }
  if (resultado.posicion == null) return null;
  return tablaPuntos[String(resultado.posicion)] ?? tablaPuntos.resto ?? 0;
}

/** En golpes netos (medal play - hándicap), gana quien menos suma. */
export function esMenorMejor(modoPuntuacion: ModoPuntuacionLiga): boolean {
  return modoPuntuacion === "suma_medal_handicap";
}

/**
 * Suma los valores de un jugador para la clasificación: todos si la liga no
 * limita a los X mejores, o solo la suma de sus mejores X (los más altos, o
 * los más bajos si en este modo gana el que menos suma) si sí.
 */
export function sumarMejores(
  valores: number[],
  mejoresN: number | null,
  menorMejor: boolean,
): number {
  if (mejoresN == null || valores.length <= mejoresN) {
    return valores.reduce((acc, v) => acc + v, 0);
  }
  const ordenados = [...valores].sort((a, b) => (menorMejor ? a - b : b - a));
  return ordenados.slice(0, mejoresN).reduce((acc, v) => acc + v, 0);
}
