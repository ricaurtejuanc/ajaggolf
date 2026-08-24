import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
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

/** Devuelve el registro de usuarios_admin del usuario autenticado, o null si no es admin. */
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
