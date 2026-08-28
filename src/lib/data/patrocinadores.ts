import { createClient } from "@/lib/supabase/server";
import { obtenerOrganizadorIdActual } from "@/lib/data/organizador";
import type { Patrocinador } from "@/types/database";

export async function listarPatrocinadores(): Promise<Patrocinador[]> {
  const supabase = await createClient();
  const organizadorId = await obtenerOrganizadorIdActual();
  let query = supabase.from("patrocinadores").select("*").order("orden");
  if (organizadorId) query = query.eq("organizador_id", organizadorId);

  const { data } = await query;
  return data ?? [];
}
