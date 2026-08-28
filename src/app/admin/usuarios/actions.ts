"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsuarioAdmin } from "@/lib/auth";

export type EstadoEliminarUsuario = { ok: boolean; error: string | null };

/**
 * Borra un usuario registrado. Su ficha de jugador solo se puede borrar
 * del todo si no tiene ninguna inscripción (inscripciones.jugador_id es
 * on delete restrict a propósito, para no perder el historial de quién
 * jugó qué torneo): si tiene alguna, se le quita el acceso (se borra su
 * cuenta de Supabase Auth) pero la ficha de jugador se conserva sin
 * usuario asociado, para no romper esa historia.
 */
export async function eliminarUsuario(jugadorId: string): Promise<EstadoEliminarUsuario> {
  const admin = await getUsuarioAdmin();
  if (!admin || !admin.organizador_id) return { ok: false, error: "No autorizado." };

  const supabase = await createClient();
  const { data: jugador } = await supabase
    .from("jugadores")
    .select("id, user_id, organizador_id")
    .eq("id", jugadorId)
    .maybeSingle();
  if (!jugador || jugador.organizador_id !== admin.organizador_id) {
    return { ok: false, error: "Usuario no encontrado." };
  }
  if (!jugador.user_id) return { ok: false, error: "Este jugador no tiene cuenta." };

  // usuarios_admin.user_id referencia a auth.users con on delete cascade:
  // borrar la cuenta de alguien que también es admin le quitaría el acceso
  // al panel sin avisar. Eso se gestiona desde "Administradores", no aquí.
  const { data: esAdmin } = await supabase
    .from("usuarios_admin")
    .select("id")
    .eq("user_id", jugador.user_id)
    .maybeSingle();
  if (esAdmin) {
    return {
      ok: false,
      error: "Esta persona también es administrador: gestiónalo desde \"Administradores\".",
    };
  }

  const { count } = await supabase
    .from("inscripciones")
    .select("id", { count: "exact", head: true })
    .eq("jugador_id", jugadorId);

  const adminClient = createAdminClient();
  const { error: errorAuth } = await adminClient.auth.admin.deleteUser(jugador.user_id);
  if (errorAuth) return { ok: false, error: errorAuth.message };

  if (count && count > 0) {
    // Tiene historial de inscripciones: se queda sin cuenta, pero su ficha
    // de jugador se mantiene (por RESTRICT no se podría borrar de todas
    // formas) para no perder los datos de esos torneos.
    await supabase.from("jugadores").update({ user_id: null }).eq("id", jugadorId);
  } else {
    await supabase.from("jugadores").delete().eq("id", jugadorId);
  }

  revalidatePath("/admin/usuarios");
  return { ok: true, error: null };
}
