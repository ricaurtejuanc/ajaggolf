export interface FilaClasificacion {
  key: number;
  nombreMostrado: string;
  licenciaFederativa: string;
  puntosTotales: string;
  eventosJugados: string;
}

let contador = 0;
export function filaVacia(base: Partial<FilaClasificacion> = {}): FilaClasificacion {
  return {
    key: contador++,
    nombreMostrado: "",
    licenciaFederativa: "",
    puntosTotales: "0",
    eventosJugados: "0",
    ...base,
  };
}
