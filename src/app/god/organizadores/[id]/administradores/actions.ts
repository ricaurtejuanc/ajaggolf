"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSuperAdmin } from "@/lib/auth";
import { buscarUsuarioPorEmail } from "@/lib/data/usuarios";

export type EstadoAltaAdminGod = { ok: boolean; error: string | null };

export async function crearAdministradorGod(
  organizadorId: string,
  _prevState: EstadoAltaAdminGod,
  formData: FormData,
): Promise<EstadoAltaAdminGod> {
  const superAdmin = await getSuperAdmin();
  if (!superAdmin) return { ok: false, error: "No autorizado." };

  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!nombre || !email) return { ok: false, error: "Rellena nombre y email." };

  const usuario = await buscarUsuarioPorEmail(email);
  if (!usuario) {
    return {
      ok: false,
      error:
        "Esa persona todavía no ha iniciado sesión en la web. Pídele que entre una vez " +
        "(con Google o su email) en el dominio de ese organizador y vuelve a intentarlo.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("usuarios_admin").insert({
    user_id: usuario.id,
    nombre,
    email,
    organizador_id: organizadorId,
  });

  if (error) {
    const mensaje =
      error.code === "23505"
        ? "Esa persona ya es administrador de este organizador."
        : error.message;
    return { ok: false, error: mensaje };
  }

  revalidatePath(`/god/organizadores/${organizadorId}/administradores`);
  return { ok: true, error: null };
}

export async function cambiarActivoAdministradorGod(organizadorId: string, id: string, activo: boolean) {
  const superAdmin = await getSuperAdmin();
  if (!superAdmin) return;

  const supabase = await createClient();
  await supabase
    .from("usuarios_admin")
    .update({ activo })
    .eq("id", id)
    .eq("organizador_id", organizadorId);

  revalidatePath(`/god/organizadores/${organizadorId}/administradores`);
}

export async function eliminarAdministradorGod(organizadorId: string, id: string) {
  const superAdmin = await getSuperAdmin();
  if (!superAdmin) return;

  const supabase = await createClient();
  await supabase.from("usuarios_admin").delete().eq("id", id).eq("organizador_id", organizadorId);

  revalidatePath(`/god/organizadores/${organizadorId}/administradores`);
}
