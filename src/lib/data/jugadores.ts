import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Jugador } from "@/types/database";
import type { User } from "@supabase/supabase-js";

/**
 * Devuelve el registro de `jugadores` ligado al usuario autenticado,
 * creándolo la primera vez que hace falta (primer login, primera inscripción).
 */
export async function asegurarJugadorParaUsuario(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<Jugador> {
  const { data: existente } = await supabase
    .from("jugadores")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existente) return existente;

  const givenName = user.user_metadata?.given_name as string | undefined;
  const familyName = user.user_metadata?.family_name as string | undefined;
  const nombreCompleto =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Jugador AJAG";

  const nombre = givenName ?? nombreCompleto;
  const apellidos = familyName ?? "";

  const { data: creado, error } = await supabase
    .from("jugadores")
    .insert({ user_id: user.id, nombre, apellidos, email: user.email ?? null })
    .select("*")
    .single();

  if (error || !creado) {
    throw error ?? new Error("No se pudo crear el registro de jugador.");
  }

  return creado;
}
