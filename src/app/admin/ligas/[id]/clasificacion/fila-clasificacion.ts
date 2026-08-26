export interface FilaClasificacion {
  key: number;
  nombreMostrado: string;
  licenciaFederativa: string;
  /** Suma de todos los resultados jugados, sin limitar a los mejores N. */
  puntosTotalesBrutos: string;
  /** Valor oficial que decide el orden del ranking (igual al bruto si la liga no limita). */
  puntosTotales: string;
  eventosJugados: string;
}

let contador = 0;
export function filaVacia(base: Partial<FilaClasificacion> = {}): FilaClasificacion {
  return {
    key: contador++,
    nombreMostrado: "",
    licenciaFederativa: "",
    puntosTotalesBrutos: "0",
    puntosTotales: "0",
    eventosJugados: "0",
    ...base,
  };
}
