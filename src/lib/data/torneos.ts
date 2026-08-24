import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { hayCuadroDeHonor } from "@/components/torneos/cuadro-de-honor";
import type { Torneo } from "@/types/database";

export async function listarTorneosPublicos(): Promise<Torneo[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("torneos")
    .select("*")
    .in("estado", ["publicado", "cerrado", "finalizado"])
    .order("fecha", { ascending: true });

  return data ?? [];
}

export async function listarProximosTorneos(limite = 3): Promise<Torneo[]> {
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("torneos")
    .select("*")
    .eq("estado", "publicado")
    .gte("fecha", hoy)
    .order("fecha", { ascending: true })
    .limit(limite);

  return data ?? [];
}

/**
 * Un admin puede ver la ficha de un torneo en cualquier estado (incluido
 * "borrador"), para revisar cómo queda antes de publicarlo. Para el resto
 * de visitantes, solo torneos ya publicados/cerrados/finalizados.
 */
export async function obtenerTorneoPorSlug(slug: string): Promise<Torneo | null> {
  const supabase = await createClient();
  const admin = await getUsuarioAdmin();

  let query = supabase.from("torneos").select("*").eq("slug", slug);
  if (!admin) {
    query = query.in("estado", ["publicado", "cerrado", "finalizado"]);
  }

  const { data } = await query.maybeSingle();
  return data;
}

export type EstadoClasificacionTorneo = { disponible: boolean };

/**
 * Para cada torneo, indica si ya hay una clasificación publicada (tabla de
 * resultados si pertenece a una liga/pool, o PDF/foto si no). Se usa para
 * mostrar el botón "Ver clasificación" habilitado o como "Aún no
 * disponible".
 */
export async function obtenerEstadoClasificacionPorTorneos(
  torneos: Torneo[],
): Promise<Record<string, EstadoClasificacionTorneo>> {
  const resultado: Record<string, EstadoClasificacionTorneo> = {};
  if (torneos.length === 0) return resultado;

  const supabase = await createClient();
  const idsConLiga = torneos.filter((t) => t.liga_pool_id).map((t) => t.id);

  // El PDF/foto vale como clasificación general para cualquier torneo; la
  // tabla de "resultados" solo cuenta en los de liga/pool, y solo si está
  // marcada como clasificación general (no los puestos guardados solo para
  // puntuar en la liga).
  const [{ data: conResultados }, { data: conPdf }] = await Promise.all([
    idsConLiga.length > 0
      ? supabase
          .from("resultados")
          .select("torneo_id")
          .eq("estado", "publicado")
          .eq("es_clasificacion_general", true)
          .in("torneo_id", idsConLiga)
      : Promise.resolve({ data: [] }),
    supabase
      .from("resultados_pdf_uploads")
      .select("torneo_id")
      .eq("estado", "publicado")
      .in(
        "torneo_id",
        torneos.map((t) => t.id),
      ),
  ]);

  const idsConClasificacion = new Set([
    ...(conResultados ?? []).map((r) => r.torneo_id),
    ...(conPdf ?? []).map((r) => r.torneo_id),
  ]);

  for (const torneo of torneos) {
    // La clasificación también está "disponible" si solo hay cuadro de
    // honor (ganadores de premios) aunque no haya tabla de resultados ni
    // PDF publicado todavía.
    resultado[torneo.id] = {
      disponible: idsConClasificacion.has(torneo.id) || hayCuadroDeHonor(torneo),
    };
  }

  return resultado;
}

/**
 * Ids de torneos que ya tienen un cuadro de salidas publicado por la app
 * (para la página de Horarios: el resto se apoya en horarios_pdf_url).
 */
export async function obtenerIdsConSalidaPublicada(torneoIds: string[]): Promise<Set<string>> {
  if (torneoIds.length === 0) return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from("salidas")
    .select("torneo_id")
    .eq("estado", "publicado")
    .in("torneo_id", torneoIds);
  return new Set((data ?? []).map((s) => s.torneo_id));
}

export async function obtenerInscritosPorTorneo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  torneoIds: string[],
): Promise<Record<string, number>> {
  if (torneoIds.length === 0) return {};
  const { data } = await supabase
    .from("torneos_cupo")
    .select("torneo_id, inscritos")
    .in("torneo_id", torneoIds);

  const conteo: Record<string, number> = {};
  for (const fila of data ?? []) {
    conteo[fila.torneo_id] = fila.inscritos;
  }
  return conteo;
}
