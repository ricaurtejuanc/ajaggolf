import "server-only";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Datos mínimos de un organizador para personalizar un email (marca +
 * a quién responder), guardar a qué organizador pertenece una fila
 * (consultas_contacto, etc.) y pintar la marca del sitio (header/footer,
 * metadata) del organizador actual. */
export type OrganizadorEmailInfo = {
  id: string;
  nombre: string;
  email_contacto: string | null;
  logo_url: string | null;
};

/**
 * Organizador resuelto por `proxy.ts` a partir del dominio de la visita
 * (cabecera `x-organizador-id`). Para páginas/acciones públicas que no
 * dependen de un torneo/consulta concreto (hoy: el formulario de
 * contacto). Si el dominio no coincide con ninguno, `proxy.ts` ya hace
 * fallback a AJAG, así que null solo debería darse en local/tests.
 */
export async function obtenerOrganizadorActual(): Promise<OrganizadorEmailInfo | null> {
  const id = await obtenerOrganizadorIdActual();
  if (!id) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("organizadores")
    .select("id, nombre, email_contacto, logo_url")
    .eq("id", id)
    .maybeSingle();
  return data;
}

/**
 * Igual que `obtenerOrganizadorActual`, pero sin ir a la base de datos: solo
 * lee la cabecera que ya puso `proxy.ts` al resolver el dominio. Para el
 * caso, mucho más frecuente, en que solo hace falta el id para filtrar una
 * consulta (torneos, ligas, patrocinadores, configuración...), no el
 * nombre/email del organizador.
 */
export async function obtenerOrganizadorIdActual(): Promise<string | null> {
  const listaCabeceras = await headers();
  return listaCabeceras.get("x-organizador-id");
}

/** Para cuando ya se conoce el organizador_id (de un torneo, una
 * consulta...) en vez de tener que resolverlo por dominio. */
export async function obtenerOrganizadorPorId(
  supabase: SupabaseClient<Database>,
  organizadorId: string | null,
): Promise<OrganizadorEmailInfo | null> {
  if (!organizadorId) return null;
  const { data } = await supabase
    .from("organizadores")
    .select("id, nombre, email_contacto, logo_url")
    .eq("id", organizadorId)
    .maybeSingle();
  return data;
}
