export type EstadoJuego = "" | "retirado" | "no_presentado";

export interface FilaResultado {
  key: number;
  inscripcionId: string | null;
  nombreMostrado: string;
  licenciaFederativa: string;
  handicap: string;
  posicion: string;
  puntos: string;
  golpes: string;
  estadoJuego: EstadoJuego;
}

let contador = 0;
export function filaVacia(base: Partial<FilaResultado> = {}): FilaResultado {
  return {
    key: contador++,
    inscripcionId: null,
    nombreMostrado: "",
    licenciaFederativa: "",
    handicap: "",
    posicion: "",
    puntos: "",
    golpes: "",
    estadoJuego: "",
    ...base,
  };
}
