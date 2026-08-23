import { createClient } from "@/lib/supabase/server";
import type { Patrocinador } from "@/types/database";

export async function listarPatrocinadores(): Promise<Patrocinador[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("patrocinadores")
    .select("*")
    .order("nombre");

  return data ?? [];
}
