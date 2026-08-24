"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { obtenerJugadoresConfirmados } from "@/lib/data/salidas";
import {
  generarCuadroSalidas,
  detectarConflictos,
  type JugadorParaSalida,
} from "@/lib/salidas/generar";
import type { ModoAsignacionSalida, ModoSalida } from "@/types/database";

export type EstadoGenerarSalidas = { ok: boolean; error: string | null };

export async function generarSalidas(
  torneoId: string,
  _prevState: EstadoGenerarSalidas,
  formData: FormData,
): Promise<EstadoGenerarSalidas> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const modo = String(formData.get("modo") ?? "consecutivo") as ModoSalida;
  const modoAsignacion = String(
    formData.get("modo_asignacion") ?? "handicap",
  ) as ModoAsignacionSalida;

  const jugadores = await obtenerJugadoresConfirmados(torneoId);
  if (jugadores.length === 0) {
    return {
      ok: false,
      error: "No hay inscripciones confirmadas todavía para generar el cuadro de salidas.",
    };
  }

  let config: Record<string, unknown>;
  let configConsecutivo: { horaInicio: string; intervaloMinutos: number; tees: number[] } | undefined;
  let configShotgun: { hoyosSalida: number[]; hoyosDoblados: number[] } | undefined;

  if (modo === "consecutivo") {
    const horaInicio = String(formData.get("hora_inicio") ?? "08:00");
    const intervaloMinutos = parseInt(String(formData.get("intervalo_minutos") ?? "10"), 10);
    const tees = formData
      .getAll("tee_consecutivo")
      .map((v) => parseInt(String(v), 10))
      .filter((n) => !Number.isNaN(n));
    if (tees.length === 0) {
      return { ok: false, error: "Elige al menos un tee de salida." };
    }
    configConsecutivo = { horaInicio, intervaloMinutos: intervaloMinutos || 10, tees };
    config = {
      hora_inicio: horaInicio,
      intervalo_minutos: configConsecutivo.intervaloMinutos,
      tees: configConsecutivo.tees,
    };
  } else {
    const hoyosSalida = formData
      .getAll("hoyos_salida")
      .map((v) => parseInt(String(v), 10))
      .filter((n) => !Number.isNaN(n) && n >= 1 && n <= 18);
    const hoyosDoblados = formData
      .getAll("hoyos_doblados")
      .map((v) => parseInt(String(v), 10))
      .filter((n) => !Number.isNaN(n) && n >= 1 && n <= 18 && hoyosSalida.includes(n));
    if (hoyosSalida.length === 0) {
      return { ok: false, error: "Indica al menos un hoyo de salida." };
    }
    configShotgun = { hoyosSalida, hoyosDoblados };
    config = { hoyos_salida: hoyosSalida, hoyos_doblados: hoyosDoblados };
  }

  const resultado = generarCuadroSalidas({
    jugadores,
    modo,
    modoAsignacion,
    configConsecutivo,
    configShotgun,
  });

  const supabase = await createClient();

  const { data: salida, error: errorSalida } = await supabase
    .from("salidas")
    .upsert(
      {
        torneo_id: torneoId,
        modo,
        config,
        modo_asignacion: modoAsignacion,
        estado: "borrador",
        generado_at: new Date().toISOString(),
        created_by: admin.id,
      },
      { onConflict: "torneo_id" },
    )
    .select("id")
    .single();

  if (errorSalida || !salida) {
    return { ok: false, error: errorSalida?.message ?? "No se pudo crear la salida." };
  }

  await supabase.from("grupos_salida").delete().eq("salida_id", salida.id);

  for (const grupo of resultado.grupos) {
    const { data: grupoInsertado, error: errorGrupo } = await supabase
      .from("grupos_salida")
      .insert({
        salida_id: salida.id,
        numero_grupo: grupo.numeroGrupo,
        hoyo_salida: grupo.hoyoSalida,
        hora_salida: grupo.horaSalida,
      })
      .select("id")
      .single();

    if (errorGrupo || !grupoInsertado) {
      return { ok: false, error: errorGrupo?.message ?? "No se pudo crear un grupo." };
    }

    if (grupo.jugadores.length > 0) {
      const filas = grupo.jugadores.map((j) => ({
        grupo_salida_id: grupoInsertado.id,
        inscripcion_id: j.inscripcionId,
        orden: j.orden,
        conflicto_juega_con: j.conflictoJuegaCon,
        conflicto_detalle: j.conflictoDetalle,
      }));
      const { error: errorJugadores } = await supabase
        .from("grupo_salida_jugadores")
        .insert(filas);
      if (errorJugadores) return { ok: false, error: errorJugadores.message };
    }
  }

  revalidatePath(`/admin/torneos/${torneoId}/salidas`);
  return { ok: true, error: null };
}

interface GrupoSalidaConJugadoresRaw {
  id: string;
  grupo_salida_jugadores: {
    id: string;
    inscripcion_id: string;
    inscripciones: {
      licencia_federativa: string | null;
      juega_con_licencias: string[];
      handicap_snapshot: number | null;
      jugador_id: string;
      jugadores: { nombre: string; apellidos: string; handicap: number | null } | null;
    } | null;
  }[];
}

/** Recalcula los avisos de "juega con" para toda la salida tras un cambio manual. */
async function recalcularConflictos(salidaId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("grupos_salida")
    .select(
      "id, grupo_salida_jugadores(id, inscripcion_id, inscripciones(licencia_federativa, juega_con_licencias, handicap_snapshot, jugador_id, jugadores(nombre, apellidos, handicap)))",
    )
    .eq("salida_id", salidaId);

  if (!data) return;
  const grupos = data as unknown as GrupoSalidaConJugadoresRaw[];

  const gruposJugadores: JugadorParaSalida[][] = grupos.map((g) =>
    (g.grupo_salida_jugadores ?? []).map((gj) => {
      const insc = gj.inscripciones;
      const jugador = insc?.jugadores;
      return {
        inscripcionId: gj.inscripcion_id,
        jugadorId: insc?.jugador_id ?? "",
        nombre: jugador ? `${jugador.nombre} ${jugador.apellidos}`.trim() : "Jugador",
        handicap: insc?.handicap_snapshot ?? jugador?.handicap ?? null,
        sexo: null,
        licenciaFederativa: insc?.licencia_federativa ?? null,
        juegaConLicencias: insc?.juega_con_licencias ?? [],
      };
    }),
  );

  const conflictos = detectarConflictos(gruposJugadores);

  for (const grupo of grupos) {
    for (const gj of grupo.grupo_salida_jugadores ?? []) {
      const c = conflictos.get(gj.inscripcion_id);
      await supabase
        .from("grupo_salida_jugadores")
        .update({
          conflicto_juega_con: c?.conflicto ?? false,
          conflicto_detalle: c?.detalle ?? null,
        })
        .eq("id", gj.id);
    }
  }
}

export async function moverJugador(
  torneoId: string,
  inscripcionId: string,
  nuevoGrupoSalidaId: string | null,
) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();

  if (nuevoGrupoSalidaId === null) {
    await supabase.from("grupo_salida_jugadores").delete().eq("inscripcion_id", inscripcionId);
  } else {
    await supabase.from("grupo_salida_jugadores").upsert(
      { grupo_salida_id: nuevoGrupoSalidaId, inscripcion_id: inscripcionId, orden: 1 },
      { onConflict: "inscripcion_id" },
    );
  }

  const { data: salida } = await supabase
    .from("salidas")
    .select("id")
    .eq("torneo_id", torneoId)
    .maybeSingle();
  if (salida) await recalcularConflictos(salida.id);

  revalidatePath(`/admin/torneos/${torneoId}/salidas`);
}

export async function publicarSalidas(torneoId: string, salidaId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  await supabase
    .from("salidas")
    .update({ estado: "publicado", publicado_at: new Date().toISOString() })
    .eq("id", salidaId);

  revalidatePath(`/admin/torneos/${torneoId}/salidas`);
  revalidatePath(`/torneos`);
}

export async function despublicarSalidas(torneoId: string, salidaId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  await supabase.from("salidas").update({ estado: "borrador" }).eq("id", salidaId);

  revalidatePath(`/admin/torneos/${torneoId}/salidas`);
}

export type EstadoHorariosPdf = { ok: boolean; error: string | null };

export async function actualizarHorariosPdf(
  torneoId: string,
  horariosPdfUrl: string | null,
): Promise<EstadoHorariosPdf> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const supabase = await createClient();
  const { data: torneo, error } = await supabase
    .from("torneos")
    .update({ horarios_pdf_url: horariosPdfUrl })
    .eq("id", torneoId)
    .select("slug")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/torneos/${torneoId}/salidas`);
  if (torneo) revalidatePath(`/torneos/${torneo.slug}`);
  return { ok: true, error: null };
}
