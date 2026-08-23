"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";

export type EstadoLigaForm = { ok: boolean; error: string | null };

function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function leerTablaPuntos(formData: FormData): Record<string, number> {
  const posiciones = formData.getAll("posicion").map((v) => String(v).trim());
  const puntos = formData.getAll("puntos").map((v) => Number(String(v).trim()));

  const tabla: Record<string, number> = {};
  posiciones.forEach((pos, i) => {
    if (!pos || Number.isNaN(puntos[i])) return;
    tabla[pos] = puntos[i];
  });
  return tabla;
}

function leerCamposLiga(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();

  return {
    nombre,
    slug: slugify(slugInput || nombre),
    descripcion: String(formData.get("descripcion") ?? "").trim() || null,
    temporada: String(formData.get("temporada") ?? "").trim() || null,
    tabla_puntos: leerTablaPuntos(formData),
    activa: formData.get("activa") === "on",
  };
}

export async function crearLiga(
  _prevState: EstadoLigaForm,
  formData: FormData,
): Promise<EstadoLigaForm> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const campos = leerCamposLiga(formData);
  if (!campos.nombre) return { ok: false, error: "El nombre es obligatorio." };
  if (Object.keys(campos.tabla_puntos).length === 0) {
    return { ok: false, error: "Define al menos una posición con puntos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ligas_pool")
    .insert(campos)
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Error al crear la liga." };

  revalidatePath("/admin/ligas");
  revalidatePath("/ligas");
  redirect(`/admin/ligas/${data.id}/editar`);
}

export async function actualizarLiga(
  ligaId: string,
  _prevState: EstadoLigaForm,
  formData: FormData,
): Promise<EstadoLigaForm> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const campos = leerCamposLiga(formData);
  if (!campos.nombre) return { ok: false, error: "El nombre es obligatorio." };
  if (Object.keys(campos.tabla_puntos).length === 0) {
    return { ok: false, error: "Define al menos una posición con puntos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ligas_pool").update(campos).eq("id", ligaId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/ligas");
  revalidatePath(`/admin/ligas/${ligaId}/editar`);
  revalidatePath("/ligas");
  revalidatePath(`/ligas/${campos.slug}`);
  return { ok: true, error: null };
}

export async function eliminarLiga(ligaId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  await supabase.from("ligas_pool").delete().eq("id", ligaId);

  revalidatePath("/admin/ligas");
  revalidatePath("/ligas");
}
