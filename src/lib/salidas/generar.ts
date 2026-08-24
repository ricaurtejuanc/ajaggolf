import type { ModoAsignacionSalida, ModoSalida } from "@/types/database";

export interface JugadorParaSalida {
  inscripcionId: string;
  jugadorId: string;
  nombre: string;
  handicap: number | null;
  sexo: string | null;
  licenciaFederativa: string | null;
  juegaConLicencias: string[];
}

export interface JugadorEnGrupo extends JugadorParaSalida {
  orden: number;
  conflictoJuegaCon: boolean;
  conflictoDetalle: string | null;
}

export interface GrupoGenerado {
  numeroGrupo: number;
  hoyoSalida: number;
  horaSalida: string | null;
  jugadores: JugadorEnGrupo[];
}

export interface ResultadoGeneracion {
  grupos: GrupoGenerado[];
  sinAsignar: JugadorParaSalida[];
}

/**
 * Reparte n jugadores en grupos de 3-4, lo más equilibrados posible.
 * Ej: 10 -> [4,3,3]; 11 -> [4,4,3]; 8 -> [4,4].
 */
export function calcularTamanosGrupos(n: number): number[] {
  if (n <= 0) return [];
  if (n <= 4) return [n];
  const numGrupos = Math.ceil(n / 4);
  const base = Math.floor(n / numGrupos);
  const resto = n - base * numGrupos;
  const tamanos = Array.from({ length: numGrupos }, () => base);
  for (let i = 0; i < resto; i++) tamanos[i] += 1;
  return tamanos;
}

export function ordenarPorHandicap(jugadores: JugadorParaSalida[]): JugadorParaSalida[] {
  return [...jugadores].sort((a, b) => {
    if (a.handicap == null && b.handicap == null) return 0;
    if (a.handicap == null) return 1;
    if (b.handicap == null) return -1;
    return a.handicap - b.handicap;
  });
}

/** Agrupa por nivel: jugadores de handicap similar quedan en el mismo grupo. */
function agruparPorHandicap(jugadores: JugadorParaSalida[]): JugadorParaSalida[][] {
  const ordenados = ordenarPorHandicap(jugadores);
  const tamanos = calcularTamanosGrupos(ordenados.length);
  const grupos: JugadorParaSalida[][] = [];
  let cursor = 0;
  for (const tamano of tamanos) {
    grupos.push(ordenados.slice(cursor, cursor + tamano));
    cursor += tamano;
  }
  return grupos;
}

/** Mezcla niveles: reparte en "abanico" para que cada grupo tenga variedad de hándicap. */
function agruparMixto(jugadores: JugadorParaSalida[]): JugadorParaSalida[][] {
  const ordenados = ordenarPorHandicap(jugadores);
  const tamanos = calcularTamanosGrupos(ordenados.length);
  const grupos: JugadorParaSalida[][] = tamanos.map(() => []);
  ordenados.forEach((jugador, i) => {
    grupos[i % grupos.length].push(jugador);
  });
  return grupos;
}

/**
 * Asigna hora de salida consecutiva desde uno o varios tees (ej. tee 1 y
 * tee 10 a la vez): los grupos se reparten por turnos entre los tees
 * elegidos, y dentro de cada tee la hora avanza de forma consecutiva
 * desde horaInicio.
 */
function asignarConsecutivo(
  grupos: JugadorParaSalida[][],
  config: { horaInicio: string; intervaloMinutos: number; tees: number[] },
): Omit<GrupoGenerado, "jugadores">[] {
  const tees = config.tees.length > 0 ? config.tees : [1];
  const [h, m] = config.horaInicio.split(":").map(Number);
  const inicioMinutos = h * 60 + m;
  const posicionPorTee = new Map<number, number>();
  return grupos.map((_, i) => {
    const tee = tees[i % tees.length];
    const posicion = posicionPorTee.get(tee) ?? 0;
    posicionPorTee.set(tee, posicion + 1);
    const minutos = inicioMinutos + posicion * config.intervaloMinutos;
    const hh = String(Math.floor(minutos / 60) % 24).padStart(2, "0");
    const mm = String(minutos % 60).padStart(2, "0");
    return { numeroGrupo: i + 1, hoyoSalida: tee, horaSalida: `${hh}:${mm}:00` };
  });
}

/** Reparte los grupos entre los hoyos de salida de un shotgun (con dobles si se indican). */
function asignarShotgun(
  grupos: JugadorParaSalida[][],
  config: { hoyosSalida: number[]; hoyosDoblados: number[] },
): Omit<GrupoGenerado, "jugadores">[] {
  const slots = [...config.hoyosSalida, ...config.hoyosDoblados];
  if (slots.length === 0) slots.push(1);
  return grupos.map((_, i) => ({
    numeroGrupo: i + 1,
    hoyoSalida: slots[i % slots.length],
    horaSalida: null,
  }));
}

/**
 * Compara lo solicitado en "¿juegas con alguien?" contra el resultado real
 * del agrupamiento. No decide nada por su cuenta: solo marca el conflicto
 * para que el admin lo revise y lo resuelva a mano.
 */
export function detectarConflictos(grupos: JugadorParaSalida[][]): Map<
  string,
  { conflicto: boolean; detalle: string | null }
> {
  const resultado = new Map<string, { conflicto: boolean; detalle: string | null }>();
  const grupoPorLicencia = new Map<string, number>();
  const nombrePorLicencia = new Map<string, string>();

  grupos.forEach((grupo, gi) => {
    for (const j of grupo) {
      if (j.licenciaFederativa) {
        grupoPorLicencia.set(j.licenciaFederativa, gi);
        nombrePorLicencia.set(j.licenciaFederativa, j.nombre);
      }
    }
  });

  grupos.forEach((grupo, gi) => {
    for (const jugador of grupo) {
      if (jugador.juegaConLicencias.length === 0) {
        resultado.set(jugador.inscripcionId, { conflicto: false, detalle: null });
        continue;
      }
      const problemas: string[] = [];
      for (const licencia of jugador.juegaConLicencias) {
        const grupoCompanero = grupoPorLicencia.get(licencia);
        if (grupoCompanero === undefined) {
          problemas.push(`solicitó jugar con la licencia ${licencia}, no encontrada entre los inscritos confirmados`);
        } else if (grupoCompanero !== gi) {
          const nombreCompanero = nombrePorLicencia.get(licencia) ?? licencia;
          problemas.push(
            `solicitó jugar con ${nombreCompanero} (licencia ${licencia}), pero quedó en el grupo ${grupoCompanero + 1}`,
          );
        }
      }
      resultado.set(jugador.inscripcionId, {
        conflicto: problemas.length > 0,
        detalle: problemas.length > 0 ? `${jugador.nombre} ${problemas.join("; ")}.` : null,
      });
    }
  });

  return resultado;
}

export interface ConfigConsecutivo {
  horaInicio: string;
  intervaloMinutos: number;
  tees: number[];
}

export interface ConfigShotgun {
  hoyosSalida: number[];
  hoyosDoblados: number[];
}

export function generarCuadroSalidas(params: {
  jugadores: JugadorParaSalida[];
  modo: ModoSalida;
  modoAsignacion: ModoAsignacionSalida;
  configConsecutivo?: ConfigConsecutivo;
  configShotgun?: ConfigShotgun;
}): ResultadoGeneracion {
  const { jugadores, modo, modoAsignacion } = params;

  if (jugadores.length === 0) return { grupos: [], sinAsignar: [] };

  if (modoAsignacion === "manual") {
    // El admin arma los grupos a mano: generamos los "huecos" (hoyo/hora)
    // correctos según el modo, pero sin jugadores asignados todavía.
    const tamanos = calcularTamanosGrupos(jugadores.length);
    const vacios = tamanos.map(() => [] as JugadorParaSalida[]);
    const metas =
      modo === "consecutivo"
        ? asignarConsecutivo(vacios, params.configConsecutivo!)
        : asignarShotgun(vacios, params.configShotgun!);

    return {
      grupos: metas.map((meta) => ({ ...meta, jugadores: [] })),
      sinAsignar: jugadores,
    };
  }

  const grupos =
    modoAsignacion === "mixto" ? agruparMixto(jugadores) : agruparPorHandicap(jugadores);

  const metas =
    modo === "consecutivo"
      ? asignarConsecutivo(grupos, params.configConsecutivo!)
      : asignarShotgun(grupos, params.configShotgun!);

  const conflictos = detectarConflictos(grupos);

  const gruposFinales: GrupoGenerado[] = grupos.map((jugadoresGrupo, i) => ({
    ...metas[i],
    jugadores: jugadoresGrupo.map((j, orden) => ({
      ...j,
      orden: orden + 1,
      conflictoJuegaCon: conflictos.get(j.inscripcionId)?.conflicto ?? false,
      conflictoDetalle: conflictos.get(j.inscripcionId)?.detalle ?? null,
    })),
  }));

  return { grupos: gruposFinales, sinAsignar: [] };
}
