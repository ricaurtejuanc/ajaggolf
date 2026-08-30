import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Ronda } from "@/types/database";

/** Cuántas rondas recientes promedia la federación para el hándicap. */
export const RONDAS_PARA_MEDIA = 8;

/**
 * Rondas guardadas del usuario autenticado, de la más reciente a la más
 * antigua. La RLS ya limita a las suyas; no hace falta filtrar por user_id.
 */
export async function listarMisRondas(): Promise<Ronda[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rondas")
    .select("*")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

/**
 * Media de los mejores differentials recientes, que es la base del hándicap
 * WHS: se toman las últimas 20 rondas y se promedian las 8 mejores. Con menos
 * de 8 rondas no se devuelve nada — un promedio de dos tarjetas no significa
 * nada y darlo por bueno induciría a error.
 */
export function mediaDifferentials(rondas: Ronda[]): number | null {
  if (rondas.length < RONDAS_PARA_MEDIA) return null;
  const mejores = rondas
    .slice(0, 20)
    .map((r) => Number(r.differential))
    .sort((a, b) => a - b)
    .slice(0, RONDAS_PARA_MEDIA);
  const media = mejores.reduce((s, d) => s + d, 0) / mejores.length;
  return Math.round(media * 10) / 10;
}
