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

/**
 * Agrupa jugadores en "bloques" que deben quedar en el mismo grupo de
 * salida porque alguno pidió jugar con otro (juega_con_licencias). Se
 * calcula por componentes conexas: si A quiere jugar con B y B con C, los
 * tres acaban en el mismo bloque aunque la petición no sea mutua. Un
 * bloque nunca supera los 4 jugadores (tamaño máximo de un grupo de golf):
 * si una cadena de peticiones forma un grupo más grande, se trocea en
 * trozos de 4 y el resto queda como conflicto para que el admin lo revise
 * (detectarConflictos), en vez de forzar un grupo imposible.
 */
function formarBloques(jugadores: JugadorParaSalida[]): JugadorParaSalida[][] {
  const porLicencia = new Map<string, JugadorParaSalida>();
  for (const j of jugadores) {
    if (j.licenciaFederativa) porLicencia.set(j.licenciaFederativa, j);
  }

  const padre = new Map<string, string>();
  for (const j of jugadores) padre.set(j.inscripcionId, j.inscripcionId);

  const raiz = (id: string): string => {
    let r = id;
    while (padre.get(r) !== r) r = padre.get(r)!;
    let actual = id;
    while (padre.get(actual) !== r) {
      const siguiente = padre.get(actual)!;
      padre.set(actual, r);
      actual = siguiente;
    }
    return r;
  };

  for (const j of jugadores) {
    for (const licencia of j.juegaConLicencias) {
      const companero = porLicencia.get(licencia);
      if (!companero) continue;
      const ra = raiz(j.inscripcionId);
      const rb = raiz(companero.inscripcionId);
      if (ra !== rb) padre.set(ra, rb);
    }
  }

  const porRaiz = new Map<string, JugadorParaSalida[]>();
  for (const j of jugadores) {
    const r = raiz(j.inscripcionId);
    const lista = porRaiz.get(r);
    if (lista) lista.push(j);
    else porRaiz.set(r, [j]);
  }

  const bloques: JugadorParaSalida[][] = [];
  for (const bloque of porRaiz.values()) {
    for (let i = 0; i < bloque.length; i += 4) {
      bloques.push(bloque.slice(i, i + 4));
    }
  }
  return bloques;
}

function promedioHandicap(bloque: JugadorParaSalida[]): number {
  const conHandicap = bloque.filter((j) => j.handicap != null);
  if (conHandicap.length === 0) return Number.POSITIVE_INFINITY;
  return conHandicap.reduce((suma, j) => suma + (j.handicap ?? 0), 0) / conHandicap.length;
}

/**
 * Reparte bloques (jugadores que deben quedar juntos) en grupos de hasta 4,
 * en el orden dado, sin romper ningún bloque: cada bloque entra en el
 * primer grupo abierto donde quepa, o abre uno nuevo. Al final intenta
 * fusionar los grupos que se hayan quedado con 1-2 jugadores sueltos en
 * otro grupo con hueco, para no dejar grupos pequeños si se puede evitar.
 */
function empaquetarBloques(bloquesOrdenados: JugadorParaSalida[][]): JugadorParaSalida[][] {
  const grupos: JugadorParaSalida[][] = [];
  for (const bloque of bloquesOrdenados) {
    const destino = grupos.find((g) => g.length + bloque.length <= 4);
    if (destino) destino.push(...bloque);
    else grupos.push([...bloque]);
  }
  for (let i = grupos.length - 1; i >= 0; i--) {
    if (grupos[i].length >= 3) continue;
    const destino = grupos.find((g, j) => j !== i && g.length + grupos[i].length <= 4);
    if (destino) {
      destino.push(...grupos[i]);
      grupos.splice(i, 1);
    }
  }
  return grupos;
}

/**
 * Agrupa por nivel (jugadores de handicap similar quedan en el mismo
 * grupo), respetando quién ha pedido jugar con quién.
 */
function agruparPorHandicap(jugadores: JugadorParaSalida[]): JugadorParaSalida[][] {
  const bloques = formarBloques(jugadores).sort(
    (a, b) => promedioHandicap(a) - promedioHandicap(b),
  );
  return empaquetarBloques(bloques);
}

/**
 * Mezcla niveles (reparte en "abanico" para que cada grupo tenga variedad
 * de hándicap), respetando quién ha pedido jugar con quién.
 */
function agruparMixto(jugadores: JugadorParaSalida[]): JugadorParaSalida[][] {
  const bloques = formarBloques(jugadores).sort(
    (a, b) => promedioHandicap(a) - promedioHandicap(b),
  );
  const numGrupos = Math.max(1, Math.round(jugadores.length / 4));
  const cubos: JugadorParaSalida[][] = Array.from({ length: numGrupos }, () => []);
  let cursor = 0;
  for (const bloque of bloques) {
    let colocado = false;
    for (let vuelta = 0; vuelta < cubos.length; vuelta++) {
      const indice = cursor % cubos.length;
      cursor++;
      if (cubos[indice].length + bloque.length <= 4) {
        cubos[indice].push(...bloque);
        colocado = true;
        break;
      }
    }
    if (!colocado) cubos.push([...bloque]);
  }
  return cubos.filter((c) => c.length > 0);
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

/**
 * Reparte los grupos entre los hoyos de salida de un shotgun. Todos salen
 * a la hora indicada; en los hoyos doblados sale un segundo grupo 10
 * minutos después. Un hoyo marcado como doblado cuenta como hoyo de
 * salida aunque no se haya marcado aparte en "hoyos de salida".
 */
function asignarShotgun(
  grupos: JugadorParaSalida[][],
  config: { horaInicio: string; hoyosSalida: number[]; hoyosDoblados: number[] },
): Omit<GrupoGenerado, "jugadores">[] {
  const [h, m] = config.horaInicio.split(":").map(Number);
  const inicioMinutos = h * 60 + m;
  const formatoHora = (minutos: number) => {
    const hh = String(Math.floor(minutos / 60) % 24).padStart(2, "0");
    const mm = String(minutos % 60).padStart(2, "0");
    return `${hh}:${mm}:00`;
  };

  const hoyosBase = [...new Set([...config.hoyosSalida, ...config.hoyosDoblados])].sort(
    (a, b) => a - b,
  );
  const slots: { hoyo: number; hora: string }[] = [];
  for (const hoyo of hoyosBase.length > 0 ? hoyosBase : [1]) {
    slots.push({ hoyo, hora: formatoHora(inicioMinutos) });
    if (config.hoyosDoblados.includes(hoyo)) {
      slots.push({ hoyo, hora: formatoHora(inicioMinutos + 10) });
    }
  }

  return grupos.map((_, i) => {
    const slot = slots[i % slots.length];
    return { numeroGrupo: i + 1, hoyoSalida: slot.hoyo, horaSalida: slot.hora };
  });
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
  horaInicio: string;
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
