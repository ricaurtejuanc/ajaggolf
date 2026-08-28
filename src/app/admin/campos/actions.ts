"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";

export type EstadoCampo = { ok: boolean; error: string | null };

/**
 * campos_golf es un catálogo compartido entre todos los organizadores
 * (sin organizador_id, a propósito): estas acciones no se escopean por
 * organizador, cualquier admin puede mantener el catálogo común.
 */
export async function crearCampo(
  _prevState: EstadoCampo,
  formData: FormData,
): Promise<EstadoCampo> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const nombre = String(formData.get("nombre") ?? "").trim();
  const recorrido = String(formData.get("recorrido") ?? "").trim();
  if (!nombre || !recorrido) return { ok: false, error: "Rellena nombre y recorrido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("campos_golf")
    .upsert({ nombre, recorrido }, { onConflict: "nombre,recorrido", ignoreDuplicates: true });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/campos");
  return { ok: true, error: null };
}

export async function renombrarClub(nombreActual: string, nombreNuevo: string): Promise<EstadoCampo> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };
  const nuevo = nombreNuevo.trim();
  if (!nuevo) return { ok: false, error: "El nombre no puede estar vacío." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("campos_golf")
    .update({ nombre: nuevo })
    .eq("nombre", nombreActual);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/campos");
  return { ok: true, error: null };
}

export async function actualizarRecorrido(id: string, recorridoNuevo: string): Promise<EstadoCampo> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };
  const nuevo = recorridoNuevo.trim();
  if (!nuevo) return { ok: false, error: "El recorrido no puede estar vacío." };

  const supabase = await createClient();
  const { error } = await supabase.from("campos_golf").update({ recorrido: nuevo }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/campos");
  return { ok: true, error: null };
}

export async function eliminarRecorrido(id: string): Promise<EstadoCampo> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase.from("campos_golf").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/campos");
  return { ok: true, error: null };
}
