import { unstable_noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function listarCamposGolf(): Promise<{ nombre: string; recorrido: string }[]> {
  unstable_noStore();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campos_golf")
    .select("nombre, recorrido")
    .order("nombre")
    .order("recorrido");

  if (error) {
    console.error("[ERROR] listarCamposGolf:", error.message);
    return [];
  }

  console.log(`[listarCamposGolf] SUCCESS: ${data?.length ?? 0} campos retrieved`);
  return data ?? [];
}
