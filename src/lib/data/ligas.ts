import { createClient } from "@/lib/supabase/server";
import type { LigaPool, Torneo } from "@/types/database";

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

  const { data: torneos } = await supabase
    .from("torneos")
    .select("*")
    .eq("liga_pool_id", liga.id)
    .in("estado", ["publicado", "cerrado", "finalizado"])
    .order("fecha", { ascending: true });

  return { liga, torneos: torneos ?? [] };
}
