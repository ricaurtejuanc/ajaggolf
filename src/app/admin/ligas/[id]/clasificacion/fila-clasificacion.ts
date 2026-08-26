export interface FilaClasificacion {
  key: number;
  nombre: string;
  apellidos: string;
  licenciaFederativa: string;
  puntosTotales: string;
  eventosJugados: string;
}

let contador = 0;
export function filaVacia(base: Partial<FilaClasificacion> = {}): FilaClasificacion {
  return {
    key: contador++,
    nombre: "",
    apellidos: "",
    licenciaFederativa: "",
    puntosTotales: "0",
    eventosJugados: "0",
    ...base,
  };
}
