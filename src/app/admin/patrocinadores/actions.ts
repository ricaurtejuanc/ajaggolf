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

  // Los nuevos patrocinadores van al final de la lista, no se mezclan con
  // el orden manual ya establecido. Se calcula el máximo orden actual y se suma 1.
  const { data: maxOrdenData } = await supabase
    .from("patrocinadores")
    .select("orden")
    .eq("organizador_id", admin.organizador_id)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  const maxOrden = maxOrdenData?.orden ?? 0;
  const nuevoOrden = maxOrden + 1;

  const { error } = await supabase
    .from("patrocinadores")
    .insert({ ...campos, organizador_id: admin.organizador_id, orden: nuevoOrden });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/patrocinadores");
  revalidatePath("/patrocinadores");
  redirect("/admin/patrocinadores");
}

/** Intercambia el orden con el patrocinador inmediatamente anterior/siguiente
 * (dentro del mismo organizador) para moverlo una posición arriba/abajo en
 * la web. */
export async function moverPatrocinador(patrocinadorId: string, direccion: "arriba" | "abajo") {
  const admin = await getUsuarioAdmin();
  if (!admin?.organizador_id) return;

  const supabase = await createClient();
  const { data: lista } = await supabase
    .from("patrocinadores")
    .select("id, orden")
    .eq("organizador_id", admin.organizador_id)
    .order("orden", { ascending: true });
  if (!lista) return;

  const indice = lista.findIndex((p) => p.id === patrocinadorId);
  const indiceVecino = direccion === "arriba" ? indice - 1 : indice + 1;
  if (indice === -1 || indiceVecino < 0 || indiceVecino >= lista.length) return;

  const actual = lista[indice];
  const vecino = lista[indiceVecino];

  await supabase.from("patrocinadores").update({ orden: vecino.orden }).eq("id", actual.id);
  await supabase.from("patrocinadores").update({ orden: actual.orden }).eq("id", vecino.id);

  revalidatePath("/admin/patrocinadores");
  revalidatePath("/patrocinadores");
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
