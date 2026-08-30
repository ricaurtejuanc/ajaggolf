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
  if (admin.rol !== "owner") {
    return { ok: false, error: "Solo el owner del organizador puede eliminar campos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("campos_golf").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/campos");
  return { ok: true, error: null };
}

/**
 * Valoraciones (tees) de un recorrido. Igual que campos_golf, el catálogo de
 * valoraciones es común a todos los organizadores, así que no se escopea.
 *
 * El club y el recorrido se guardan copiados en campo_tees (no referenciados
 * a campos_golf) porque el catálogo vino así de la federación, con su propio
 * club_code. Al dar de alta un tee desde aquí se reutiliza el club_code que
 * ya tenga el club, y si es la primera valoración se deriva del nombre.
 */
type TeeValido = { tee: string; genero: "H" | "M"; cr: number; slope: number; par: number };

function leerTee(formData: FormData): { tee: TeeValido } | { error: string } {
  const num = (clave: string) => Number(String(formData.get(clave) ?? "").replace(",", "."));
  const tee = String(formData.get("tee") ?? "").trim().toUpperCase();
  const genero = String(formData.get("genero") ?? "");
  const [cr, slope, par] = [num("cr"), num("slope"), num("par")];

  if (!tee) return { error: "Indica el nombre de la barra." };
  if (genero !== "H" && genero !== "M") return { error: "Indica el género de la barra." };
  if (!Number.isFinite(cr) || cr <= 0) return { error: "El Course Rating no es válido." };
  // El suelo nominal del WHS es 55, pero el catálogo oficial trae un 54 en un
  // recorrido de pares 3, así que se acepta desde 50.
  if (!Number.isFinite(slope) || slope < 50 || slope > 155) {
    return { error: "El slope debe estar entre 50 y 155." };
  }
  if (!Number.isInteger(par) || par < 27 || par > 90) return { error: "El par no es válido." };

  return { tee: { tee, genero, cr, slope, par } };
}

export async function crearTee(
  club: string,
  recorrido: string,
  _prevState: EstadoCampo,
  formData: FormData,
): Promise<EstadoCampo> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const leido = leerTee(formData);
  if ("error" in leido) return { ok: false, error: leido.error };
  const t = leido.tee;

  const supabase = await createClient();

  // Un club puede tener ya valoraciones en otros recorridos: se hereda su
  // club_code y su federación para no partir el catálogo en dos.
  const { data: hermano } = await supabase
    .from("campo_tees")
    .select("club_code, federacion")
    .eq("club_nombre", club)
    .limit(1)
    .maybeSingle();

  const { error: errorInsert } = await supabase.from("campo_tees").insert({
    federacion: hermano?.federacion ?? "Otras",
    club_code: hermano?.club_code ?? club.slice(0, 8).toUpperCase(),
    club_nombre: club,
    recorrido,
    tee: t.tee,
    genero: t.genero,
    cr: t.cr,
    slope: t.slope,
    par: t.par,
  });
  if (errorInsert) {
    if (errorInsert.code === "23505") {
      return { ok: false, error: "Ese recorrido ya tiene esa barra para ese género." };
    }
    return { ok: false, error: errorInsert.message };
  }

  revalidatePath("/admin/campos");
  revalidatePath("/handicap");
  return { ok: true, error: null };
}

export async function actualizarTee(
  teeId: string,
  _prevState: EstadoCampo,
  formData: FormData,
): Promise<EstadoCampo> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const leido = leerTee(formData);
  if ("error" in leido) return { ok: false, error: leido.error };
  const t = leido.tee;

  const supabase = await createClient();
  const { error: errorUpdate } = await supabase
    .from("campo_tees")
    .update({ tee: t.tee, genero: t.genero, cr: t.cr, slope: t.slope, par: t.par })
    .eq("id", teeId);
  if (errorUpdate) return { ok: false, error: errorUpdate.message };

  revalidatePath("/admin/campos");
  revalidatePath("/handicap");
  return { ok: true, error: null };
}

export async function eliminarTee(teeId: string): Promise<EstadoCampo> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const supabase = await createClient();
  // La tarjeta hoyo a hoyo cuelga del tee con on delete cascade.
  const { error } = await supabase.from("campo_tees").delete().eq("id", teeId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/campos");
  revalidatePath("/handicap");
  return { ok: true, error: null };
}
