"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsuarioAdmin } from "@/lib/auth";

export type EstadoAltaAdmin = { ok: boolean; error: string | null };

/**
 * Busca un usuario ya registrado (Supabase Auth) por email. La Admin API no
 * tiene "buscar por email" directo, así que se pagina listUsers — de sobra
 * para el número de cuentas de un club/asociación.
 */
async function buscarUsuarioPorEmail(email: string): Promise<{ id: string } | null> {
  const admin = createAdminClient();
  const emailNormalizado = email.toLowerCase();

  for (let pagina = 1; pagina <= 20; pagina++) {
    const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 200 });
    if (error || data.users.length === 0) return null;

    const encontrado = data.users.find((u) => u.email?.toLowerCase() === emailNormalizado);
    if (encontrado) return { id: encontrado.id };

    if (data.users.length < 200) return null; // última página, no está
  }
  return null;
}

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
