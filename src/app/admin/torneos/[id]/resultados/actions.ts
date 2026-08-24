"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { extraerFilasPdf } from "@/lib/resultados/extraer-pdf";
import { recalcularClasificacionGlobal } from "@/lib/clasificacion/recalcular";
import { leerPremiosDesdeFormData } from "@/lib/premios";
import { obtenerInscritosConfirmadosParaResultados } from "@/lib/data/resultados";

export type EstadoDocumento = { ok: boolean; error: string | null };

export async function subirDocumento(
  torneoId: string,
  storagePath: string,
  nombreArchivo: string,
  esPdf: boolean,
): Promise<EstadoDocumento> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const supabase = await createClient();

  let filasExtraidas: unknown = { filas: [], texto: "" };
  if (esPdf) {
    try {
      const { data: blob, error: errorDescarga } = await supabase.storage
        .from("resultados-pdf")
        .download(storagePath);
      if (errorDescarga || !blob) throw errorDescarga ?? new Error("Descarga vacía");
      const buffer = Buffer.from(await blob.arrayBuffer());
      const { textoCompleto, filas } = await extraerFilasPdf(buffer);
      filasExtraidas = { filas, texto: textoCompleto };
    } catch {
      // Si el PDF no se puede leer (escaneado como imagen, formato raro...)
      // seguimos adelante: el admin siempre puede rellenar a mano.
      filasExtraidas = { filas: [], texto: "" };
    }
  }

  const { error } = await supabase.from("resultados_pdf_uploads").insert({
    torneo_id: torneoId,
    storage_path: storagePath,
    nombre_archivo: nombreArchivo,
    mapeo_columnas: {},
    filas_extraidas: filasExtraidas,
    estado: "preview",
    subido_por: admin.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/torneos/${torneoId}/resultados`);
  return { ok: true, error: null };
}

export type EstadoResultados = { ok: boolean; error: string | null };

export async function guardarResultados(
  torneoId: string,
  publicar: boolean,
  _prevState: EstadoResultados,
  formData: FormData,
): Promise<EstadoResultados> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const inscripcionIds = formData.getAll("inscripcion_id").map((v) => String(v));
  const nombres = formData.getAll("nombre_mostrado").map((v) => String(v).trim());
  const licencias = formData.getAll("licencia_federativa").map((v) => String(v).trim());
  const handicaps = formData.getAll("handicap").map((v) => String(v).trim());
  const posiciones = formData.getAll("posicion").map((v) => String(v).trim());
  const puntos = formData.getAll("puntos").map((v) => String(v).trim());
  const golpes = formData.getAll("golpes").map((v) => String(v).trim());

  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("torneos")
    .select("id, liga_pool_id, slug")
    .eq("id", torneoId)
    .maybeSingle();
  if (!torneo) return { ok: false, error: "Torneo no encontrado." };

  const filas = nombres
    .map((nombre, i) => ({
      torneo_id: torneoId,
      jugador_id: null as string | null,
      inscripcion_id: inscripcionIds[i] || null,
      nombre_mostrado: nombre,
      licencia_federativa: licencias[i] || null,
      handicap: handicaps[i] ? Number(handicaps[i].replace(",", ".")) : null,
      posicion: posiciones[i] ? parseInt(posiciones[i], 10) : null,
      puntos: puntos[i] ? Number(puntos[i].replace(",", ".")) : null,
      golpes: golpes[i] ? Number(golpes[i].replace(",", ".")) : null,
      estado: publicar ? "publicado" : "preview",
      // Esta tabla la rellena el admin fila a fila a mano: sí cuenta como
      // la clasificación general publicada del torneo (a diferencia de los
      // puestos generados solo para puntuar la liga).
      es_clasificacion_general: true,
    }))
    .filter((f) => f.nombre_mostrado);

  if (inscripcionIds.length > 0) {
    const { data: inscritos } = await supabase
      .from("inscripciones")
      .select("id, jugador_id")
      .in("id", inscripcionIds.filter(Boolean));
    const jugadorPorInscripcion = new Map((inscritos ?? []).map((i) => [i.id, i.jugador_id]));
    for (const fila of filas) {
      if (fila.inscripcion_id) {
        fila.jugador_id = jugadorPorInscripcion.get(fila.inscripcion_id) ?? null;
      }
    }
  }

  await supabase.from("resultados").delete().eq("torneo_id", torneoId);

  if (filas.length > 0) {
    const { error } = await supabase.from("resultados").insert(filas);
    if (error) return { ok: false, error: error.message };
  }

  if (publicar) {
    await supabase
      .from("resultados_pdf_uploads")
      .update({ estado: "publicado", publicado_at: new Date().toISOString() })
      .eq("torneo_id", torneoId)
      .eq("estado", "preview");
  }

  if (torneo.liga_pool_id) {
    await recalcularClasificacionGlobal(torneo.liga_pool_id);
  }

  revalidatePath(`/admin/torneos/${torneoId}/resultados`);
  revalidatePath(`/torneos`);
  revalidatePath(`/torneos/${torneo.slug}/clasificacion`);
  return { ok: true, error: null };
}

export async function publicarDocumento(torneoId: string, documentoId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  await supabase
    .from("resultados_pdf_uploads")
    .update({ estado: "publicado", publicado_at: new Date().toISOString() })
    .eq("id", documentoId);

  const { data: torneo } = await supabase
    .from("torneos")
    .select("slug")
    .eq("id", torneoId)
    .maybeSingle();

  revalidatePath(`/admin/torneos/${torneoId}/resultados`);
  revalidatePath("/torneos");
  if (torneo) revalidatePath(`/torneos/${torneo.slug}/clasificacion`);
}

export async function despublicarDocumento(torneoId: string, documentoId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  await supabase.from("resultados_pdf_uploads").update({ estado: "preview" }).eq("id", documentoId);

  const { data: torneo } = await supabase
    .from("torneos")
    .select("slug")
    .eq("id", torneoId)
    .maybeSingle();

  revalidatePath(`/admin/torneos/${torneoId}/resultados`);
  if (torneo) revalidatePath(`/torneos/${torneo.slug}/clasificacion`);
}

export type EstadoGanadores = { ok: boolean; error: string | null };

function leerGanadores(formData: FormData): Record<string, string[]> {
  let crudo: unknown;
  try {
    crudo = JSON.parse(String(formData.get("ganadores") ?? "{}"));
  } catch {
    return {};
  }
  if (typeof crudo !== "object" || crudo === null) return {};

  const ganadores: Record<string, string[]> = {};
  for (const [clave, valores] of Object.entries(crudo as Record<string, unknown>)) {
    if (!Array.isArray(valores)) continue;
    const nombres = valores
      .map((v) => String(v ?? "").trim())
      .filter((v): v is string => v.length > 0);
    if (nombres.length > 0) ganadores[clave] = nombres;
  }
  return ganadores;
}

export async function actualizarGanadoresPremios(
  torneoId: string,
  _prevState: EstadoGanadores,
  formData: FormData,
): Promise<EstadoGanadores> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const ganadores = leerGanadores(formData);
  const premios = leerPremiosDesdeFormData(formData);

  const supabase = await createClient();
  const { data: torneo, error } = await supabase
    .from("torneos")
    .update({ premios_ganadores: ganadores, premios })
    .eq("id", torneoId)
    .select("slug")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/torneos/${torneoId}/resultados`);
  if (torneo) {
    revalidatePath(`/torneos/${torneo.slug}`);
    revalidatePath(`/torneos/${torneo.slug}/clasificacion`);
  }
  return { ok: true, error: null };
}

export type EstadoPosicionesLiga = { ok: boolean; error: string | null };

function leerPosiciones(formData: FormData): Record<string, string> {
  let crudo: unknown;
  try {
    crudo = JSON.parse(String(formData.get("posiciones") ?? "{}"));
  } catch {
    return {};
  }
  if (typeof crudo !== "object" || crudo === null) return {};

  const posiciones: Record<string, string> = {};
  for (const [posicion, inscripcionId] of Object.entries(crudo as Record<string, unknown>)) {
    const valor = String(inscripcionId ?? "").trim();
    if (valor) posiciones[posicion] = valor;
  }
  return posiciones;
}

/**
 * Genera la clasificación de un torneo de liga/pool a partir de los
 * ganadores de cada puesto que puntúa (según la tabla_puntos de la liga),
 * en vez de pedir la clasificación completa fila a fila. Solo toca las
 * filas de los puestos que se están asignando (crea o actualiza la del
 * jugador ganador, y "desaloja" al que ocupaba antes ese puesto si ha
 * cambiado): no borra el resto de la tabla de resultados del torneo, para
 * no perder filas ya rellenadas a mano con golpes u otros datos.
 */
export async function guardarPosicionesLiga(
  torneoId: string,
  ligaPoolId: string,
  _prevState: EstadoPosicionesLiga,
  formData: FormData,
): Promise<EstadoPosicionesLiga> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const posiciones = leerPosiciones(formData);
  if (Object.keys(posiciones).length === 0) {
    return { ok: false, error: "Asigna al menos un puesto." };
  }

  const supabase = await createClient();

  const [{ data: torneo }, { data: liga }, confirmados, { data: existentes }] = await Promise.all([
    supabase.from("torneos").select("slug").eq("id", torneoId).maybeSingle(),
    supabase.from("ligas_pool").select("tabla_puntos").eq("id", ligaPoolId).maybeSingle(),
    obtenerInscritosConfirmadosParaResultados(torneoId),
    supabase.from("resultados").select("id, inscripcion_id, posicion").eq("torneo_id", torneoId),
  ]);
  if (!torneo) return { ok: false, error: "Torneo no encontrado." };
  if (!liga) return { ok: false, error: "Liga no encontrada." };

  const tablaPuntos = liga.tabla_puntos as Record<string, number>;
  const porInscripcion = new Map(confirmados.map((c) => [c.inscripcionId, c]));
  const filaPorInscripcion = new Map(
    (existentes ?? [])
      .filter((r): r is typeof r & { inscripcion_id: string } => r.inscripcion_id != null)
      .map((r) => [r.inscripcion_id, r]),
  );
  const posicionesNumericas = Object.keys(posiciones)
    .map((p) => parseInt(p, 10))
    .filter((n) => Number.isFinite(n));

  // Si un puesto cambia de ganador, la fila del jugador que lo ocupaba
  // antes deja de tener ese puesto (para no dejar a dos jugadores con el
  // mismo puesto), pero conserva el resto de sus datos.
  const idsADesasignar = (existentes ?? [])
    .filter(
      (r) =>
        r.posicion != null &&
        posicionesNumericas.includes(r.posicion) &&
        posiciones[String(r.posicion)] !== r.inscripcion_id,
    )
    .map((r) => r.id);
  if (idsADesasignar.length > 0) {
    const { error } = await supabase
      .from("resultados")
      .update({ posicion: null, puntos: null })
      .in("id", idsADesasignar);
    if (error) return { ok: false, error: error.message };
  }

  let filasResueltas = 0;
  for (const [posicionStr, inscripcionId] of Object.entries(posiciones)) {
    const inscrito = porInscripcion.get(inscripcionId);
    const posicion = parseInt(posicionStr, 10);
    if (!inscrito || !Number.isFinite(posicion)) continue;
    filasResueltas++;
    const puntos = tablaPuntos[posicionStr] ?? tablaPuntos.resto ?? 0;

    const filaExistente = filaPorInscripcion.get(inscripcionId);
    if (filaExistente) {
      const { error } = await supabase
        .from("resultados")
        .update({ posicion, puntos, estado: "publicado" })
        .eq("id", filaExistente.id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await supabase.from("resultados").insert({
        torneo_id: torneoId,
        jugador_id: inscrito.jugadorId,
        inscripcion_id: inscrito.inscripcionId,
        nombre_mostrado: inscrito.nombreCompleto,
        licencia_federativa: inscrito.licenciaFederativa,
        handicap: inscrito.handicap,
        posicion,
        puntos,
        golpes: null,
        estado: "publicado",
        // Esta fila solo existe para puntuar en la liga: no cuenta como
        // clasificación general del torneo publicada (esa es la tabla
        // completa a mano o el PDF/foto).
        es_clasificacion_general: false,
      });
      if (error) return { ok: false, error: error.message };
    }
  }

  if (filasResueltas === 0) return { ok: false, error: "No se pudo resolver ningún puesto." };

  await recalcularClasificacionGlobal(ligaPoolId);

  revalidatePath(`/admin/torneos/${torneoId}/resultados`);
  revalidatePath("/torneos");
  revalidatePath(`/torneos/${torneo.slug}/clasificacion`);
  return { ok: true, error: null };
}
