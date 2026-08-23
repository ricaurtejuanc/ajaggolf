"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import type {
  EstadoTorneo,
  FormatoPuntuacion,
  ModoAsignacionSalida,
  ModoSalida,
} from "@/types/database";

export type EstadoTorneoForm = { ok: boolean; error: string | null };

function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos (á -> a + combining mark)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function leerCamposTorneo(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const precioEuros = String(formData.get("precio_euros") ?? "0").replace(",", ".");
  const cupoRaw = String(formData.get("cupo_maximo") ?? "").trim();
  const tees = String(formData.get("tees") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return {
    nombre,
    slug: slugify(slugInput || nombre),
    descripcion: String(formData.get("descripcion") ?? "").trim() || null,
    info_adicional: String(formData.get("info_adicional") ?? "").trim() || null,
    campo_golf: String(formData.get("campo_golf") ?? "").trim(),
    tees,
    fecha: String(formData.get("fecha") ?? ""),
    hora_inicio: String(formData.get("hora_inicio") ?? "").trim() || null,
    poster_url: String(formData.get("poster_url") ?? "").trim() || null,
    precio_cents: Math.round(parseFloat(precioEuros || "0") * 100),
    cupo_maximo: cupoRaw ? parseInt(cupoRaw, 10) : null,
    formato_puntuacion: String(formData.get("formato_puntuacion") ?? "stableford") as FormatoPuntuacion,
    modo_salida: String(formData.get("modo_salida") ?? "consecutivo") as ModoSalida,
    modo_asignacion_salida: String(
      formData.get("modo_asignacion_salida") ?? "handicap",
    ) as ModoAsignacionSalida,
    liga_pool_id: String(formData.get("liga_pool_id") ?? "").trim() || null,
    estado: String(formData.get("estado") ?? "borrador") as EstadoTorneo,
  };
}

export async function crearTorneo(
  _prevState: EstadoTorneoForm,
  formData: FormData,
): Promise<EstadoTorneoForm> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const campos = leerCamposTorneo(formData);
  if (!campos.nombre || !campos.campo_golf || !campos.fecha) {
    return { ok: false, error: "Nombre, campo y fecha son obligatorios." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("torneos")
    .insert({ ...campos, created_by: admin.id })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Error al crear el torneo." };

  revalidatePath("/admin/torneos");
  revalidatePath("/torneos");
  redirect(`/admin/torneos/${data.id}/editar`);
}

export async function actualizarTorneo(
  torneoId: string,
  _prevState: EstadoTorneoForm,
  formData: FormData,
): Promise<EstadoTorneoForm> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const campos = leerCamposTorneo(formData);
  if (!campos.nombre || !campos.campo_golf || !campos.fecha) {
    return { ok: false, error: "Nombre, campo y fecha son obligatorios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("torneos").update(campos).eq("id", torneoId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/torneos");
  revalidatePath(`/admin/torneos/${torneoId}/editar`);
  revalidatePath("/torneos");
  revalidatePath(`/torneos/${campos.slug}`);
  return { ok: true, error: null };
}

export async function eliminarTorneo(torneoId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  await supabase.from("torneos").delete().eq("id", torneoId);

  revalidatePath("/admin/torneos");
  revalidatePath("/torneos");
}
