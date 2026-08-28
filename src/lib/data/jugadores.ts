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

  // Si ya se inscribió como invitado antes de tener cuenta, reclama esa
  // ficha (con su licencia, hándicap, etc.) en vez de crear una duplicada:
  // si no, el email queda repartido en dos jugadores distintos y la
  // licencia federativa choca con la restricción unique al rellenarla.
  if (user.email) {
    const { data: invitado } = await supabase
      .from("jugadores")
      .select("*")
      .is("user_id", null)
      .eq("email", user.email)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (invitado) {
      const { data: reclamado, error: errorReclamo } = await supabase
        .from("jugadores")
        .update({ user_id: user.id })
        .eq("id", invitado.id)
        .select("*")
        .single();

      if (!errorReclamo && reclamado) return reclamado;
    }
  }

  const givenName = user.user_metadata?.given_name as string | undefined;
  const familyName = user.user_metadata?.family_name as string | undefined;
  const nombreCompleto =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Jugador AJAG";

  // El registro con Google trae nombre/apellidos ya separados; el registro
  // con email solo pide un campo "Nombre" (nombreCompleto), así que se
  // divide por el mismo criterio que el resto de la app: primera palabra
  // es el nombre, el resto los apellidos.
  const nombre = givenName ?? nombreCompleto.trim().split(/\s+/)[0] ?? nombreCompleto;
  const apellidos = familyName ?? nombreCompleto.trim().split(/\s+/).slice(1).join(" ");
  const telefono = (user.user_metadata?.telefono as string | undefined) ?? null;

  const { data: creado, error } = await supabase
    .from("jugadores")
    .insert({ user_id: user.id, nombre, apellidos, email: user.email ?? null, telefono })
    .select("*")
    .single();

  if (error) {
    // Otra petición concurrente para el mismo usuario (doble pestaña, doble
    // navegación antes de que la primera terminase) ganó la carrera y ya
    // creó su ficha: jugadores.user_id es unique, así que esto no es un
    // fallo real, solo hay que devolver la que ya existe en vez de duplicarla.
    if (error.code === "23505") {
      const { data: yaCreado } = await supabase
        .from("jugadores")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (yaCreado) return yaCreado;
    }
    throw error;
  }
  if (!creado) throw new Error("No se pudo crear el registro de jugador.");

  return creado;
}

/**
 * Código de licencia único (AJAG + 6 dígitos) para un jugador que se
 * inscribe sin tener licencia federativa real. Comprueba que no choque con
 * ninguna ya guardada antes de devolverlo.
 */
export async function generarLicenciaUnica(supabase: SupabaseClient<Database>): Promise<string> {
  for (let intento = 0; intento < 20; intento++) {
    const codigo = `AJAG${Math.floor(100000 + Math.random() * 900000)}`;
    const { data } = await supabase
      .from("jugadores")
      .select("id")
      .eq("licencia_federativa", codigo)
      .maybeSingle();
    if (!data) return codigo;
  }
  throw new Error("No se pudo generar una licencia única. Inténtalo de nuevo.");
}
