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

/** Teléfono de WhatsApp para gestionar inscripciones fuera de la web, si el organizador lo ha configurado. */
export async function obtenerWhatsappTelefono(): Promise<string | null> {
  const organizadorId = await obtenerOrganizadorIdActual();
  if (!organizadorId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "whatsapp_telefono")
    .eq("organizador_id", organizadorId)
    .maybeSingle();

  return typeof data?.valor === "string" && data.valor.trim() ? data.valor : null;
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

/**
 * Si este organizador lleva o no la economía (ingresos/gastos) en la
 * plataforma. Por defecto sí: la sección ya existía cuando se añadió el
 * interruptor, así que un club que no haya tocado nada la sigue viendo igual;
 * quien no quiera llevarla la apaga desde /admin/economia.
 */
export async function economiaActiva(organizadorId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "economia_activa")
    .eq("organizador_id", organizadorId)
    .maybeSingle();

  return typeof data?.valor === "boolean" ? data.valor : true;
}
