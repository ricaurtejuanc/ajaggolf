import { createClient } from "@/lib/supabase/server";
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

export async function obtenerTorneoPorSlug(slug: string): Promise<Torneo | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("torneos")
    .select("*")
    .eq("slug", slug)
    .in("estado", ["publicado", "cerrado", "finalizado"])
    .maybeSingle();

  return data;
}

export async function listarTorneosConClasificacion(): Promise<Torneo[]> {
  const supabase = await createClient();
  const torneos = await listarTorneosPublicos();
  if (torneos.length === 0) return [];

  const idsConLiga = torneos.filter((t) => t.liga_pool_id).map((t) => t.id);
  const idsSinLiga = torneos.filter((t) => !t.liga_pool_id).map((t) => t.id);

  const [{ data: conResultados }, { data: conPdf }] = await Promise.all([
    idsConLiga.length > 0
      ? supabase
          .from("resultados")
          .select("torneo_id")
          .eq("estado", "publicado")
          .in("torneo_id", idsConLiga)
      : Promise.resolve({ data: [] }),
    idsSinLiga.length > 0
      ? supabase
          .from("resultados_pdf_uploads")
          .select("torneo_id")
          .eq("estado", "publicado")
          .in("torneo_id", idsSinLiga)
      : Promise.resolve({ data: [] }),
  ]);

  const idsConClasificacion = new Set([
    ...(conResultados ?? []).map((r) => r.torneo_id),
    ...(conPdf ?? []).map((r) => r.torneo_id),
  ]);

  return torneos.filter((t) => idsConClasificacion.has(t.id));
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
