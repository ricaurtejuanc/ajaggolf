import { createClient } from "@/lib/supabase/server";
import { obtenerOrganizadorIdActual } from "@/lib/data/organizador";
import type { Patrocinador } from "@/types/database";

export async function listarPatrocinadores(): Promise<Patrocinador[]> {
  const supabase = await createClient();
  const organizadorId = await obtenerOrganizadorIdActual();
  if (!organizadorId) return [];

  const { data } = await supabase
    .from("patrocinadores")
    .select("*")
    .eq("organizador_id", organizadorId)
    .order("orden");

  return data ?? [];
}
