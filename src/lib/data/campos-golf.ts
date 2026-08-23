import { createClient } from "@/lib/supabase/server";

export async function listarCamposGolf(): Promise<{ nombre: string; recorrido: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campos_golf")
    .select("nombre, recorrido")
    .order("nombre")
    .order("recorrido");

  return data ?? [];
}
