"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { buscarUsuarioPorEmail } from "@/lib/data/usuarios";

export type EstadoAltaAdmin = { ok: boolean; error: string | null };

export async function crearAdministrador(
  _prevState: EstadoAltaAdmin,
  formData: FormData,
): Promise<EstadoAltaAdmin> {
  const admin = await getUsuarioAdmin();
  if (!admin || !admin.organizador_id) return { ok: false, error: "No autorizado." };

  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!nombre || !email) return { ok: false, error: "Rellena nombre y email." };

  const usuario = await buscarUsuarioPorEmail(email);
  if (!usuario) {
    return {
      ok: false,
      error:
        "Esa persona todavía no ha iniciado sesión en la web. Pídele que entre una vez " +
        "(con Google o el enlace por email) y vuelve a intentarlo.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("usuarios_admin").insert({
    user_id: usuario.id,
    nombre,
    email,
    organizador_id: admin.organizador_id,
  });

  if (error) {
    const mensaje =
      error.code === "23505"
        ? "Esa persona ya es administrador (aquí o en otro organizador)."
        : error.message;
    return { ok: false, error: mensaje };
  }

  revalidatePath("/admin/administradores");
  return { ok: true, error: null };
}

export async function cambiarActivoAdministrador(id: string, activo: boolean) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;
  if (id === admin.id && !activo) return; // no puede desactivarse a sí mismo

  const supabase = await createClient();
  await supabase.from("usuarios_admin").update({ activo }).eq("id", id);

  revalidatePath("/admin/administradores");
}

export async function eliminarAdministrador(id: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;
  if (id === admin.id) return; // no puede eliminarse a sí mismo

  const supabase = await createClient();
  await supabase.from("usuarios_admin").delete().eq("id", id);

  revalidatePath("/admin/administradores");
}
