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
 * organizador del dominio actual, o null si no es admin ahí (una misma
 * persona puede ser admin de varios organizadores — cada uno con su
 * propia fila — así que se filtra directamente por el organizador
 * resuelto por dominio en vez de traer "la" fila del usuario y confiar en
 * que solo tenga una: con dos o más, un simple user_id+activo sería
 * ambiguo — igual que le pasaba a organizador_id_actual() en Postgres
 * antes de la migración admin_multi_organizador, que arregla lo mismo del
 * lado de las políticas RLS).
 */
export const getUsuarioAdmin = cache(async (): Promise<UsuarioAdmin | null> => {
  const user = await getUsuarioActual();
  if (!user) return null;

  const organizadorIdActual = await obtenerOrganizadorIdActual();
  if (!organizadorIdActual) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("usuarios_admin")
    .select("*")
    .eq("user_id", user.id)
    .eq("activo", true)
    .eq("organizador_id", organizadorIdActual)
    .maybeSingle();

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
