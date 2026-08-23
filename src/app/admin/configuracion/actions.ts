"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";

export type EstadoConfiguracion = { ok: boolean; error: string | null };

export async function actualizarBizumNumero(
  _prevState: EstadoConfiguracion,
  formData: FormData,
): Promise<EstadoConfiguracion> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const numero = String(formData.get("bizum_numero") ?? "").trim();
  if (!numero) return { ok: false, error: "Introduce un número válido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracion")
    .update({ valor: numero, actualizado_por: admin.id, updated_at: new Date().toISOString() })
    .eq("clave", "bizum_numero");

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/configuracion");
  revalidatePath("/cuenta");
  return { ok: true, error: null };
}
