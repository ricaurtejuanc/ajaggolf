import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { obtenerOrganizadorIdActual } from "@/lib/data/organizador";
import type { SuperAdmin, UsuarioAdmin } from "@/types/database";

// supabase.auth.getUser() valida el token contra el servidor de Auth en cada
// llamada (no es una simple lectura de cookie), así que se cachea por
// request: layout, header y página acaban pidiendo el usuario/admin varias
// veces en el mismo request y no tiene sentido repetir el viaje de red.
export const getUsuarioActual = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Devuelve el registro de usuarios_admin del usuario autenticado para el
 * organizador del dominio actual, o null si no es admin (o lo es, pero de
 * otro organizador). Antes solo miraba user_id+activo, sin comprobar el
 * dominio: un admin de AJAG que entrara en /admin desde el subdominio de
 * OTRO organizador (p.ej. tgeagolf.torneos.aftergolf.es/admin) pasaba el
 * `if (!admin)` igual, y como las consultas de ese panel se filtran por
 * "el organizador del propio admin" (no por el dominio visitado), acababa
 * viendo y editando los torneos/usuarios de AJAG ahí — cada admin debe
 * quedar atado al organizador de su propio sitio, nunca al de otro.
 */
export const getUsuarioAdmin = cache(async (): Promise<UsuarioAdmin | null> => {
  const user = await getUsuarioActual();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("usuarios_admin")
    .select("*")
    .eq("user_id", user.id)
    .eq("activo", true)
    .maybeSingle();

  if (!data) return null;

  const organizadorIdActual = await obtenerOrganizadorIdActual();
  if (organizadorIdActual && data.organizador_id !== organizadorIdActual) return null;

  return data;
});

/** Devuelve el registro de super_admins del usuario autenticado ("god"), o null si no lo es. */
export const getSuperAdmin = cache(async (): Promise<SuperAdmin | null> => {
  const user = await getUsuarioActual();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("super_admins")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
});
