"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSuperAdmin } from "@/lib/auth";

export type EstadoOrganizadorForm = { ok: boolean; error: string | null };

function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function leerCamposOrganizador(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();

  return {
    nombre,
    slug: slugify(slugInput || nombre),
    logo_url: String(formData.get("logo_url") ?? "").trim() || null,
    color_primario: String(formData.get("color_primario") ?? "").trim() || null,
    dominio: String(formData.get("dominio") ?? "").trim() || null,
    email_contacto: String(formData.get("email_contacto") ?? "").trim() || null,
    activo: formData.get("activo") === "on",
  };
}

export async function crearOrganizador(
  _prevState: EstadoOrganizadorForm,
  formData: FormData,
): Promise<EstadoOrganizadorForm> {
  const superAdmin = await getSuperAdmin();
  if (!superAdmin) return { ok: false, error: "No autorizado." };

  const campos = leerCamposOrganizador(formData);
  if (!campos.nombre) return { ok: false, error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase.from("organizadores").insert(campos);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/god/organizadores");
  redirect("/god/organizadores");
}

export async function actualizarOrganizador(
  organizadorId: string,
  _prevState: EstadoOrganizadorForm,
  formData: FormData,
): Promise<EstadoOrganizadorForm> {
  const superAdmin = await getSuperAdmin();
  if (!superAdmin) return { ok: false, error: "No autorizado." };

  const campos = leerCamposOrganizador(formData);
  if (!campos.nombre) return { ok: false, error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase.from("organizadores").update(campos).eq("id", organizadorId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/god/organizadores");
  revalidatePath(`/god/organizadores/${organizadorId}/editar`);
  redirect("/god/organizadores");
}
