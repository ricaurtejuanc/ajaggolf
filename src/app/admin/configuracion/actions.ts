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
  if (!admin?.organizador_id) return { ok: false, error: "No autorizado." };

  const numero = String(formData.get("bizum_numero") ?? "").trim();
  if (!numero) return { ok: false, error: "Introduce un número válido." };

  const supabase = await createClient();
  const { error } = await supabase.from("configuracion").upsert(
    {
      clave: "bizum_numero",
      organizador_id: admin.organizador_id,
      valor: numero,
      actualizado_por: admin.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organizador_id,clave" },
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/configuracion");
  revalidatePath("/cuenta");
  return { ok: true, error: null };
}

export async function actualizarDatosPago(
  _prevState: EstadoConfiguracion,
  formData: FormData,
): Promise<EstadoConfiguracion> {
  const admin = await getUsuarioAdmin();
  if (!admin?.organizador_id) return { ok: false, error: "No autorizado." };

  const bizumNumero = String(formData.get("bizum_numero") ?? "").trim();
  const bizumNombre = String(formData.get("bizum_nombre") ?? "").trim();
  const transferenciaNumero = String(formData.get("transferencia_numero") ?? "").trim();
  const transferenciaNombre = String(formData.get("transferencia_nombre") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizadores")
    .update({
      bizum_numero: bizumNumero || null,
      bizum_nombre: bizumNombre || null,
      transferencia_numero: transferenciaNumero || null,
      transferencia_nombre: transferenciaNombre || null,
    })
    .eq("id", admin.organizador_id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/configuracion");
  revalidatePath("/carrito");
  return { ok: true, error: null };
}

export async function actualizarCategoriasExtras(
  _prevState: EstadoConfiguracion,
  formData: FormData,
): Promise<EstadoConfiguracion> {
  const admin = await getUsuarioAdmin();
  if (!admin?.organizador_id) return { ok: false, error: "No autorizado." };

  let categoriasCrudo: unknown;
  try {
    categoriasCrudo = JSON.parse(String(formData.get("categorias") ?? "[]"));
  } catch {
    return { ok: false, error: "Datos inválidos." };
  }
  if (!Array.isArray(categoriasCrudo)) return { ok: false, error: "Datos inválidos." };

  const categorias = categoriasCrudo
    .map((cat) => {
      if (typeof cat !== "object" || cat === null) return null;
      const categoria = String((cat as { categoria?: unknown }).categoria ?? "").trim();
      const opcionesCrudo = (cat as { opciones?: unknown }).opciones;
      if (!categoria || !Array.isArray(opcionesCrudo)) return null;
      const opciones = opcionesCrudo
        .map((op) => {
          if (typeof op !== "object" || op === null) return null;
          const value = String((op as { value?: unknown }).value ?? "").trim();
          const label = String((op as { label?: unknown }).label ?? "").trim();
          if (!value || !label) return null;
          return { value, label };
        })
        .filter((o): o is { value: string; label: string } => o != null);
      if (opciones.length === 0) return null;
      return { categoria, opciones };
    })
    .filter((c): c is { categoria: string; opciones: { value: string; label: string }[] } => c != null);

  const supabase = await createClient();
  const { error } = await supabase.from("configuracion").upsert(
    {
      clave: "categorias_extras",
      organizador_id: admin.organizador_id,
      valor: categorias,
      actualizado_por: admin.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organizador_id,clave" },
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/torneos", "layout");
  revalidatePath("/torneos", "layout");
  return { ok: true, error: null };
}
