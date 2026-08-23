import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SuperAdmin, UsuarioAdmin } from "@/types/database";

export async function getUsuarioActual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Devuelve el registro de usuarios_admin del usuario autenticado, o null si no es admin. */
export async function getUsuarioAdmin(): Promise<UsuarioAdmin | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("usuarios_admin")
    .select("*")
    .eq("user_id", user.id)
    .eq("activo", true)
    .maybeSingle();

  return data;
}

/** Devuelve el registro de super_admins del usuario autenticado ("god"), o null si no lo es. */
export async function getSuperAdmin(): Promise<SuperAdmin | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("super_admins")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}
