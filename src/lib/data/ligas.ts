import { createClient } from "@/lib/supabase/server";
import { obtenerOrganizadorIdActual } from "@/lib/data/organizador";
import type { LigaPool, Torneo } from "@/types/database";

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

/** El slug ya es único por liga (no por organizador), pero se filtra igual
 * por el organizador del dominio actual para que la liga de otro
 * organizador nunca se cuele por su slug en un sitio que no es el suyo. */
export async function obtenerLigaPorSlug(
  slug: string,
): Promise<{ liga: LigaPool; torneos: Torneo[] } | null> {
  const supabase = await createClient();
  const organizadorId = await obtenerOrganizadorIdActual();
  let query = supabase.from("ligas_pool").select("*").eq("slug", slug);
  if (organizadorId) query = query.eq("organizador_id", organizadorId);

  const { data: liga } = await query.maybeSingle();
  return obtenerLigaConTorneos(liga);
}

export async function listarLigasActivas(): Promise<LigaPool[]> {
  const supabase = await createClient();
  const organizadorId = await obtenerOrganizadorIdActual();
  let query = supabase
    .from("ligas_pool")
    .select("*")
    .eq("activa", true)
    .order("nombre", { ascending: true });
  if (organizadorId) query = query.eq("organizador_id", organizadorId);

  const { data } = await query;
  return data ?? [];
}
