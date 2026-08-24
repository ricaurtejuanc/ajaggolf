"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import type { TipoLigaOficial } from "@/types/database";

export type EstadoLigaForm = { ok: boolean; error: string | null };

const MENSAJE_TIPO_OFICIAL_DUPLICADO =
  "Ya hay otra liga marcada con ese tipo. Quítale antes el Ranking/Pool oficial a esa liga.";
const MENSAJE_NOMBRE_DUPLICADO =
  "Ya existe otra liga con este nombre (o muy parecido). Usa un nombre distinto.";

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
  const tipoOficialRaw = String(formData.get("tipo_oficial") ?? "").trim();
  const tipoOficial: TipoLigaOficial | null =
    tipoOficialRaw === "ranking" || tipoOficialRaw === "pool" ? tipoOficialRaw : null;

  return {
    nombre,
    descripcion: String(formData.get("descripcion") ?? "").trim() || null,
    imagen_url: String(formData.get("imagen_url") ?? "").trim() || null,
    reglas: String(formData.get("reglas") ?? "").trim() || null,
    temporada: String(formData.get("temporada") ?? "").trim() || null,
    tabla_puntos: leerTablaPuntos(formData),
    tipo_oficial: tipoOficial,
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
    .insert({ ...campos, slug: slugify(campos.nombre) })
    .select("id")
    .single();

  if (error || !data) {
    const mensaje =
      error?.code === "23505"
        ? error.message.includes("slug")
          ? MENSAJE_NOMBRE_DUPLICADO
          : MENSAJE_TIPO_OFICIAL_DUPLICADO
        : (error?.message ?? "Error al crear la liga.");
    return { ok: false, error: mensaje };
  }

  revalidatePath("/admin/ligas");
  revalidatePath("/ligas");
  redirect("/admin/ligas");
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

  // El slug no se toca en la edición: cambiar el nombre no debe romper
  // enlaces ya compartidos a la liga.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ligas_pool")
    .update(campos)
    .eq("id", ligaId)
    .select("slug")
    .single();

  if (error) {
    const mensaje = error.code === "23505" ? MENSAJE_TIPO_OFICIAL_DUPLICADO : error.message;
    return { ok: false, error: mensaje };
  }

  revalidatePath("/admin/ligas");
  revalidatePath(`/admin/ligas/${ligaId}/editar`);
  revalidatePath("/ligas");
  if (data) revalidatePath(`/ligas/${data.slug}`);
  redirect("/admin/ligas");
}

export async function eliminarLiga(ligaId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  await supabase.from("ligas_pool").delete().eq("id", ligaId);

  revalidatePath("/admin/ligas");
  revalidatePath("/ligas");
}
