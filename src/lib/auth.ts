import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { UsuarioAdmin } from "@/types/database";

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
