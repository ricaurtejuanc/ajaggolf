import { createClient } from "@/lib/supabase/server";
import type { LigaPool, Torneo } from "@/types/database";

export async function listarLigasActivas(): Promise<LigaPool[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ligas_pool")
    .select("*")
    .eq("activa", true)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function obtenerLigaPorSlug(
  slug: string,
): Promise<{ liga: LigaPool; torneos: Torneo[] } | null> {
  const supabase = await createClient();
  const { data: liga } = await supabase
    .from("ligas_pool")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!liga) return null;

  const { data: eventos } = await supabase
    .from("liga_pool_eventos")
    .select("torneo_id, orden")
    .eq("liga_pool_id", liga.id)
    .order("orden", { ascending: true });

  const torneoIds = (eventos ?? []).map((e) => e.torneo_id);
  if (torneoIds.length === 0) return { liga, torneos: [] };

  const { data: torneos } = await supabase
    .from("torneos")
    .select("*")
    .in("id", torneoIds)
    .in("estado", ["publicado", "cerrado", "finalizado"])
    .order("fecha", { ascending: true });

  return { liga, torneos: torneos ?? [] };
}
