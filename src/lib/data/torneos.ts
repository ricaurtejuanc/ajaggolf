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
