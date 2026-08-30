import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { etiquetaCategoria } from "@/lib/economia/categorias";
import type { EstadoTorneo, MovimientoEconomico } from "@/types/database";

export type EconomiaTorneo = {
  torneoId: string;
  nombre: string;
  fecha: string;
  estado: EstadoTorneo;
  inscritosConfirmados: number;
  inscritosPendientes: number;
  /** Cobrado por inscripciones confirmadas. */
  ingresosInscripciones: number;
  /** Inscripciones aún sin confirmar el pago: no cuenta como ingreso todavía. */
  pendienteCobro: number;
  ingresosManuales: number;
  gastos: number;
  ingresosTotales: number;
  beneficio: number;
};

export type EconomiaResumen = {
  anios: number[];
  anio: number | null;
  torneos: EconomiaTorneo[];
  generales: {
    ingresos: number;
    gastos: number;
    movimientos: MovimientoEconomico[];
  };
  totales: {
    ingresos: number;
    gastos: number;
    beneficio: number;
    pendienteCobro: number;
    inscritos: number;
  };
};

function anioDe(fechaISO: string): number {
  return Number(fechaISO.slice(0, 4));
}

/**
 * Resumen económico del organizador del admin actual, opcionalmente acotado a
 * un año. El ingreso por inscripciones se calcula aquí (suma de las
 * confirmadas) en vez de leerse de una tabla contable: así nunca puede
 * divergir del estado real de las inscripciones.
 *
 * Todo el agregado se hace en JS sobre tres consultas planas en lugar de con
 * vistas o RPC en Postgres. Son volúmenes de club (decenas de torneos,
 * centenares de inscripciones al año), así que no compensa la complejidad de
 * mantener una vista más; si algún organizador creciera mucho, el sitio
 * natural para moverlo sería una vista `economia_por_torneo`.
 */
export async function obtenerResumenEconomia(anio?: number): Promise<EconomiaResumen | null> {
  const admin = await getUsuarioAdmin();
  if (!admin?.organizador_id) return null;

  const supabase = await createClient();

  const [{ data: torneosData }, { data: movimientosData }] = await Promise.all([
    supabase
      .from("torneos")
      .select("id, nombre, fecha, estado")
      .eq("organizador_id", admin.organizador_id)
      .order("fecha", { ascending: false }),
    supabase
      .from("movimientos_economicos")
      .select("*")
      .eq("organizador_id", admin.organizador_id)
      .order("fecha", { ascending: false }),
  ]);

  const todosTorneos = torneosData ?? [];
  const todosMovimientos = movimientosData ?? [];

  // Los años que se ofrecen en el filtro salen de lo que realmente hay
  // (torneos y movimientos), no de un rango fijo alrededor del año actual.
  const anios = [
    ...new Set([
      ...todosTorneos.map((t) => anioDe(t.fecha)),
      ...todosMovimientos.map((m) => anioDe(m.fecha)),
    ]),
  ].sort((a, b) => b - a);

  const torneos = anio ? todosTorneos.filter((t) => anioDe(t.fecha) === anio) : todosTorneos;
  const movimientos = anio
    ? todosMovimientos.filter((m) => anioDe(m.fecha) === anio)
    : todosMovimientos;

  const idsTorneo = torneos.map((t) => t.id);
  const { data: inscripcionesData } = idsTorneo.length
    ? await supabase
        .from("inscripciones")
        .select("torneo_id, precio_cents, estado")
        .in("torneo_id", idsTorneo)
    : { data: [] };

  const porTorneo = new Map<string, EconomiaTorneo>();
  for (const t of torneos) {
    porTorneo.set(t.id, {
      torneoId: t.id,
      nombre: t.nombre,
      fecha: t.fecha,
      estado: t.estado,
      inscritosConfirmados: 0,
      inscritosPendientes: 0,
      ingresosInscripciones: 0,
      pendienteCobro: 0,
      ingresosManuales: 0,
      gastos: 0,
      ingresosTotales: 0,
      beneficio: 0,
    });
  }

  for (const i of inscripcionesData ?? []) {
    const fila = porTorneo.get(i.torneo_id);
    if (!fila) continue;
    if (i.estado === "confirmada") {
      fila.inscritosConfirmados += 1;
      fila.ingresosInscripciones += i.precio_cents;
    } else if (i.estado === "pendiente_pago") {
      fila.inscritosPendientes += 1;
      fila.pendienteCobro += i.precio_cents;
    }
    // 'carrito' y 'cancelada' no son ni ingreso ni previsión de cobro.
  }

  const generales: MovimientoEconomico[] = [];
  for (const m of movimientos) {
    const fila = m.torneo_id ? porTorneo.get(m.torneo_id) : undefined;
    if (!fila) {
      // Sin torneo, o de un torneo fuera del año filtrado: va al bloque general.
      if (!m.torneo_id) generales.push(m);
      continue;
    }
    if (m.tipo === "ingreso") fila.ingresosManuales += m.importe_cents;
    else fila.gastos += m.importe_cents;
  }

  for (const fila of porTorneo.values()) {
    fila.ingresosTotales = fila.ingresosInscripciones + fila.ingresosManuales;
    fila.beneficio = fila.ingresosTotales - fila.gastos;
  }

  const filas = [...porTorneo.values()];
  const generalesIngresos = generales
    .filter((m) => m.tipo === "ingreso")
    .reduce((s, m) => s + m.importe_cents, 0);
  const generalesGastos = generales
    .filter((m) => m.tipo === "gasto")
    .reduce((s, m) => s + m.importe_cents, 0);

  const ingresos = filas.reduce((s, f) => s + f.ingresosTotales, 0) + generalesIngresos;
  const gastos = filas.reduce((s, f) => s + f.gastos, 0) + generalesGastos;

  return {
    anios,
    anio: anio ?? null,
    torneos: filas,
    generales: { ingresos: generalesIngresos, gastos: generalesGastos, movimientos: generales },
    totales: {
      ingresos,
      gastos,
      beneficio: ingresos - gastos,
      pendienteCobro: filas.reduce((s, f) => s + f.pendienteCobro, 0),
      inscritos: filas.reduce((s, f) => s + f.inscritosConfirmados, 0),
    },
  };
}

export type DesgloseCategoria = {
  categoria: string;
  etiqueta: string;
  importe: number;
  /** Porcentaje sobre el total de su bloque (ingresos o gastos). */
  pct: number;
};

export type EstadisticasTorneo = {
  cupoMaximo: number | null;
  /** Ocupación sobre el cupo; null si el torneo no tiene cupo definido. */
  ocupacionPct: number | null;
  confirmados: number;
  pendientes: number;
  canceladas: number;
  socios: number;
  noSocios: number;
  /** Medias por inscrito confirmado (0 si aún no hay ninguno). */
  ingresoPorJugador: number;
  gastoPorJugador: number;
  beneficioPorJugador: number;
  ingresosPorCategoria: DesgloseCategoria[];
  gastosPorCategoria: DesgloseCategoria[];
};

export type EconomiaDetalleTorneo = {
  torneo: { id: string; nombre: string; slug: string; fecha: string };
  resumen: EconomiaTorneo;
  estadisticas: EstadisticasTorneo;
  movimientos: MovimientoEconomico[];
};

function desglosar(
  filas: { categoria: string; etiqueta: string; importe: number }[],
  total: number,
): DesgloseCategoria[] {
  // Se agrupa por categoría y se ordena de mayor a menor: lo que primero
  // quiere ver quien revisa un torneo es en qué se fue el dinero.
  const porCategoria = new Map<string, DesgloseCategoria>();
  for (const f of filas) {
    const previo = porCategoria.get(f.categoria);
    if (previo) previo.importe += f.importe;
    else porCategoria.set(f.categoria, { ...f, pct: 0 });
  }
  const lista = [...porCategoria.values()].sort((a, b) => b.importe - a.importe);
  for (const fila of lista) {
    fila.pct = total > 0 ? Math.round((fila.importe / total) * 100) : 0;
  }
  return lista;
}

/** Detalle económico de un torneo: cifras, estadísticas y sus movimientos. */
export async function obtenerEconomiaTorneo(
  torneoId: string,
): Promise<EconomiaDetalleTorneo | null> {
  const admin = await getUsuarioAdmin();
  if (!admin?.organizador_id) return null;

  const supabase = await createClient();
  const { data: torneo } = await supabase
    .from("torneos")
    .select("id, nombre, slug, fecha, estado, cupo_maximo")
    .eq("id", torneoId)
    .eq("organizador_id", admin.organizador_id)
    .maybeSingle();
  if (!torneo) return null;

  const [{ data: inscripciones }, { data: movimientos }] = await Promise.all([
    supabase
      .from("inscripciones")
      .select("precio_cents, estado, es_socio")
      .eq("torneo_id", torneoId),
    supabase
      .from("movimientos_economicos")
      .select("*")
      .eq("torneo_id", torneoId)
      .order("fecha", { ascending: false }),
  ]);

  const resumen: EconomiaTorneo = {
    torneoId: torneo.id,
    nombre: torneo.nombre,
    fecha: torneo.fecha,
    estado: torneo.estado,
    inscritosConfirmados: 0,
    inscritosPendientes: 0,
    ingresosInscripciones: 0,
    pendienteCobro: 0,
    ingresosManuales: 0,
    gastos: 0,
    ingresosTotales: 0,
    beneficio: 0,
  };

  let canceladas = 0;
  let socios = 0;
  let noSocios = 0;

  for (const i of inscripciones ?? []) {
    if (i.estado === "confirmada") {
      resumen.inscritosConfirmados += 1;
      resumen.ingresosInscripciones += i.precio_cents;
      // El reparto socio/no socio solo se cuenta sobre las confirmadas:
      // mezclarlo con carritos abandonados daría una foto engañosa.
      if (i.es_socio) socios += 1;
      else noSocios += 1;
    } else if (i.estado === "pendiente_pago") {
      resumen.inscritosPendientes += 1;
      resumen.pendienteCobro += i.precio_cents;
    } else if (i.estado === "cancelada") {
      canceladas += 1;
    }
  }

  for (const m of movimientos ?? []) {
    if (m.tipo === "ingreso") resumen.ingresosManuales += m.importe_cents;
    else resumen.gastos += m.importe_cents;
  }

  resumen.ingresosTotales = resumen.ingresosInscripciones + resumen.ingresosManuales;
  resumen.beneficio = resumen.ingresosTotales - resumen.gastos;

  const confirmados = resumen.inscritosConfirmados;
  const porJugador = (total: number) => (confirmados > 0 ? Math.round(total / confirmados) : 0);

  const estadisticas: EstadisticasTorneo = {
    cupoMaximo: torneo.cupo_maximo,
    ocupacionPct: torneo.cupo_maximo
      ? Math.round((confirmados / torneo.cupo_maximo) * 100)
      : null,
    confirmados,
    pendientes: resumen.inscritosPendientes,
    canceladas,
    socios,
    noSocios,
    ingresoPorJugador: porJugador(resumen.ingresosTotales),
    gastoPorJugador: porJugador(resumen.gastos),
    beneficioPorJugador: porJugador(resumen.beneficio),
    ingresosPorCategoria: desglosar(
      [
        // La línea de inscripciones es sintética: no existe como movimiento,
        // se calcula, pero en el desglose tiene que aparecer o el reparto de
        // ingresos no cuadraría con el total.
        ...(resumen.ingresosInscripciones > 0
          ? [
              {
                categoria: "inscripciones",
                etiqueta: "Inscripciones",
                importe: resumen.ingresosInscripciones,
              },
            ]
          : []),
        ...(movimientos ?? [])
          .filter((m) => m.tipo === "ingreso")
          .map((m) => ({
            categoria: m.categoria,
            etiqueta: etiquetaCategoria("ingreso", m.categoria),
            importe: m.importe_cents,
          })),
      ],
      resumen.ingresosTotales,
    ),
    gastosPorCategoria: desglosar(
      (movimientos ?? [])
        .filter((m) => m.tipo === "gasto")
        .map((m) => ({
          categoria: m.categoria,
          etiqueta: etiquetaCategoria("gasto", m.categoria),
          importe: m.importe_cents,
        })),
      resumen.gastos,
    ),
  };

  return { torneo, resumen, estadisticas, movimientos: movimientos ?? [] };
}
