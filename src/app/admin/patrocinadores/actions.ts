"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";

export type EstadoPatrocinadorForm = { ok: boolean; error: string | null };

function leerCamposPatrocinador(formData: FormData) {
  return {
    nombre: String(formData.get("nombre") ?? "").trim(),
    logo_url: String(formData.get("logo_url") ?? "").trim(),
    web: String(formData.get("web") ?? "").trim() || null,
    telefono: String(formData.get("telefono") ?? "").trim() || null,
  };
}

export async function crearPatrocinador(
  _prevState: EstadoPatrocinadorForm,
  formData: FormData,
): Promise<EstadoPatrocinadorForm> {
  const admin = await getUsuarioAdmin();
  if (!admin?.organizador_id) return { ok: false, error: "No autorizado." };

  const campos = leerCamposPatrocinador(formData);
  if (!campos.nombre) return { ok: false, error: "El nombre es obligatorio." };
  if (!campos.logo_url) return { ok: false, error: "Sube un logo." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("patrocinadores")
    .insert({ ...campos, organizador_id: admin.organizador_id });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/patrocinadores");
  revalidatePath("/patrocinadores");
  redirect("/admin/patrocinadores");
}

export async function actualizarPatrocinador(
  patrocinadorId: string,
  _prevState: EstadoPatrocinadorForm,
  formData: FormData,
): Promise<EstadoPatrocinadorForm> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const campos = leerCamposPatrocinador(formData);
  if (!campos.nombre) return { ok: false, error: "El nombre es obligatorio." };
  if (!campos.logo_url) return { ok: false, error: "Sube un logo." };

  const supabase = await createClient();
  const { error } = await supabase.from("patrocinadores").update(campos).eq("id", patrocinadorId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/patrocinadores");
  revalidatePath("/patrocinadores");
  redirect("/admin/patrocinadores");
}

export async function eliminarPatrocinador(patrocinadorId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  await supabase.from("patrocinadores").delete().eq("id", patrocinadorId);

  revalidatePath("/admin/patrocinadores");
  revalidatePath("/patrocinadores");
}
