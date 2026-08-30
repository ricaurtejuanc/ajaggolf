import { createClient } from "@/lib/supabase/server";
import { obtenerOrganizadorIdActual } from "@/lib/data/organizador";
import type { CategoriaExtra } from "@/types/database";

export async function obtenerBizumNumero(): Promise<string> {
  const organizadorId = await obtenerOrganizadorIdActual();
  if (!organizadorId) return "633 88 10 27 4";

  const supabase = await createClient();
  const { data } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "bizum_numero")
    .eq("organizador_id", organizadorId)
    .maybeSingle();

  return typeof data?.valor === "string" ? data.valor : "633 88 10 27 4";
}

export async function obtenerDatosPago() {
  const organizadorId = await obtenerOrganizadorIdActual();
  if (!organizadorId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("organizadores")
    .select("bizum_numero, bizum_nombre, transferencia_numero, transferencia_nombre")
    .eq("id", organizadorId)
    .maybeSingle();

  return data ?? null;
}

export async function obtenerCategoriasExtras(): Promise<CategoriaExtra[]> {
  const organizadorId = await obtenerOrganizadorIdActual();
  if (!organizadorId) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "categorias_extras")
    .eq("organizador_id", organizadorId)
    .maybeSingle();

  return Array.isArray(data?.valor) ? (data.valor as CategoriaExtra[]) : [];
}
