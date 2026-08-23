import { createClient } from "@/lib/supabase/server";
import type { CategoriaExtra } from "@/types/database";

export async function obtenerBizumNumero(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "bizum_numero")
    .maybeSingle();

  return typeof data?.valor === "string" ? data.valor : "633 88 10 27 4";
}

export async function obtenerCategoriasExtras(): Promise<CategoriaExtra[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "categorias_extras")
    .maybeSingle();

  return Array.isArray(data?.valor) ? (data.valor as CategoriaExtra[]) : [];
}
