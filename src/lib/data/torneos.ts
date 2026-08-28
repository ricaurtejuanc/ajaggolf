import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { obtenerOrganizadorIdActual } from "@/lib/data/organizador";
import { hayCuadroDeHonor } from "@/components/torneos/cuadro-de-honor";
import type { Torneo } from "@/types/database";

export async function listarTorneosPublicos(): Promise<Torneo[]> {
  const supabase = await createClient();
  const organizadorId = await obtenerOrganizadorIdActual();
  let query = supabase
    .from("torneos")
    .select("*")
    .in("estado", ["publicado", "cerrado", "finalizado", "cancelado"])
    .order("fecha", { ascending: true });
  if (organizadorId) query = query.eq("organizador_id", organizadorId);

  const { data } = await query;
  return data ?? [];
}

export async function listarProximosTorneos(limite = 3): Promise<Torneo[]> {
  const supabase = await createClient();
  const organizadorId = await obtenerOrganizadorIdActual();
  const hoy = new Date().toISOString().slice(0, 10);
  let query = supabase
    .from("torneos")
    .select("*")
    // "Completo" (cerrado) sigue contando como próximo torneo, igual que en
    // el calendario: solo "finalizado" deja de ser un próximo torneo.
    .in("estado", ["publicado", "cerrado"])
    .gte("fecha", hoy)
    .order("fecha", { ascending: true })
    .limit(limite);
  if (organizadorId) query = query.eq("organizador_id", organizadorId);

  const { data } = await query;
  return data ?? [];
}

/**
 * Un admin puede ver la ficha de un torneo en cualquier estado (incluido
 * "borrador"), para revisar cómo queda antes de publicarlo. Para el resto
 * de visitantes, solo torneos ya publicados/cerrados/finalizados. El slug
 * ya es único por torneo (no por organizador), pero se filtra igual por el
 * organizador del dominio actual para que un torneo de otro organizador
 * nunca se cuele por su slug en un sitio que no es el suyo.
 */
export async function obtenerTorneoPorSlug(slug: string): Promise<Torneo | null> {
  const supabase = await createClient();
  const admin = await getUsuarioAdmin();
  const organizadorId = await obtenerOrganizadorIdActual();

  let query = supabase.from("torneos").select("*").eq("slug", slug);
  if (!admin) {
    query = query.in("estado", ["publicado", "cerrado", "finalizado", "cancelado"]);
  }
  if (organizadorId) query = query.eq("organizador_id", organizadorId);

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
  const idsTorneos = torneos.map((t) => t.id);

  // El PDF/foto y la tabla de "resultados" (marcada como clasificación
  // general, no los puestos guardados solo para puntuar en una liga)
  // valen igual para cualquier torneo, sea o no de liga/pool.
  const [{ data: conResultados }, { data: conPdf }] = await Promise.all([
    supabase
      .from("resultados")
      .select("torneo_id")
      .eq("estado", "publicado")
      .eq("es_clasificacion_general", true)
      .in("torneo_id", idsTorneos),
    supabase
      .from("resultados_pdf_uploads")
      .select("torneo_id")
      .eq("estado", "publicado")
      .in("torneo_id", idsTorneos),
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

// `torneos_cupo` es una vista que cuenta en vivo sobre `inscripciones` en
// cada consulta. Esta función solo se usa para el número de plazas que se
// enseña en las tarjetas (home, calendario) — no para decidir si cabe una
// inscripción nueva (eso lo comprueba cada acción de inscripción aparte,
// siempre en vivo) — así que cachear el conteo un rato no arriesga
// sobrevender plazas, solo que la tarjeta tarde hasta 30s en reflejar la
// última inscripción.
const CACHE_INSCRITOS_TTL_MS = 30_000;
const cacheInscritos = new Map<string, { inscritos: number; expira: number }>();

export async function obtenerInscritosPorTorneo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  torneoIds: string[],
): Promise<Record<string, number>> {
  if (torneoIds.length === 0) return {};

  const ahora = Date.now();
  const conteo: Record<string, number> = {};
  const idsAConsultar: string[] = [];

  for (const id of torneoIds) {
    const cacheado = cacheInscritos.get(id);
    if (cacheado && cacheado.expira > ahora) {
      conteo[id] = cacheado.inscritos;
    } else {
      idsAConsultar.push(id);
    }
  }

  if (idsAConsultar.length > 0) {
    const { data } = await supabase
      .from("torneos_cupo")
      .select("torneo_id, inscritos")
      .in("torneo_id", idsAConsultar);

    const encontrados = new Set<string>();
    for (const fila of data ?? []) {
      conteo[fila.torneo_id] = fila.inscritos;
      cacheInscritos.set(fila.torneo_id, { inscritos: fila.inscritos, expira: ahora + CACHE_INSCRITOS_TTL_MS });
      encontrados.add(fila.torneo_id);
    }
    // Un torneo sin ninguna inscripción no sale en la vista (el group by no
    // genera fila): se cachea igual como 0 para no volver a consultarlo.
    for (const id of idsAConsultar) {
      if (!encontrados.has(id)) {
        conteo[id] = 0;
        cacheInscritos.set(id, { inscritos: 0, expira: ahora + CACHE_INSCRITOS_TTL_MS });
      }
    }
  }

  return conteo;
}
