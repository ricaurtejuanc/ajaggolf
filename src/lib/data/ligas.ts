import { createClient } from "@/lib/supabase/server";
import type { LigaPool, TipoLigaOficial, Torneo } from "@/types/database";

async function obtenerLigaConTorneos(
  liga: LigaPool | null,
): Promise<{ liga: LigaPool; torneos: Torneo[] } | null> {
  if (!liga) return null;

  const supabase = await createClient();
  const { data: torneos } = await supabase
    .from("torneos")
    .select("*")
    .eq("liga_pool_id", liga.id)
    .in("estado", ["publicado", "cerrado", "finalizado"])
    .order("fecha", { ascending: true });

  return { liga, torneos: torneos ?? [] };
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

  return obtenerLigaConTorneos(liga);
}

export async function listarLigasActivas(): Promise<LigaPool[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ligas_pool")
    .select("*")
    .eq("activa", true)
    .order("nombre", { ascending: true });

  return data ?? [];
}

/** Devuelve la liga marcada como Ranking o Pool oficial, sea cual sea su nombre/slug. */
export async function obtenerLigaOficial(
  tipo: TipoLigaOficial,
): Promise<{ liga: LigaPool; torneos: Torneo[] } | null> {
  const supabase = await createClient();
  const { data: liga } = await supabase
    .from("ligas_pool")
    .select("*")
    .eq("tipo_oficial", tipo)
    .eq("activa", true)
    .maybeSingle();

  return obtenerLigaConTorneos(liga);
}
