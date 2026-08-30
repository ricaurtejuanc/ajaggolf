"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin, getUsuarioActual } from "@/lib/auth";
import { esCategoriaValida } from "@/lib/economia/categorias";
import type { TipoMovimiento } from "@/types/database";

export type EstadoMovimientoForm = { ok: boolean; error: string | null };

/**
 * Convierte el importe que teclea el admin (en euros, con coma o punto) a
 * céntimos enteros. Se redondea porque `12,345` o un `0.1 + 0.2` en coma
 * flotante no deben acabar guardando 1234.4999 céntimos.
 */
function importeAcentimos(valor: string): number | null {
  const normalizado = valor.replace(/\s/g, "").replace(",", ".");
  if (!normalizado) return null;
  const euros = Number(normalizado);
  if (!Number.isFinite(euros) || euros < 0) return null;
  return Math.round(euros * 100);
}

export async function crearMovimiento(
  _prevState: EstadoMovimientoForm,
  formData: FormData,
): Promise<EstadoMovimientoForm> {
  const admin = await getUsuarioAdmin();
  if (!admin?.organizador_id) return { ok: false, error: "No autorizado." };

  const tipo = String(formData.get("tipo") ?? "") as TipoMovimiento;
  if (tipo !== "ingreso" && tipo !== "gasto") return { ok: false, error: "Tipo no válido." };

  const categoria = String(formData.get("categoria") ?? "");
  if (!esCategoriaValida(tipo, categoria)) return { ok: false, error: "Categoría no válida." };

  const concepto = String(formData.get("concepto") ?? "").trim();
  if (!concepto) return { ok: false, error: "Escribe un concepto." };

  const importeCents = importeAcentimos(String(formData.get("importe") ?? ""));
  if (importeCents === null) return { ok: false, error: "El importe no es válido." };
  if (importeCents === 0) return { ok: false, error: "El importe no puede ser 0." };

  const fecha = String(formData.get("fecha") ?? "").trim();
  if (!fecha) return { ok: false, error: "Indica una fecha." };

  const torneoIdBruto = String(formData.get("torneo_id") ?? "").trim();
  const torneoId = torneoIdBruto || null;

  const supabase = await createClient();

  // El torneo debe ser del propio organizador. La RLS ya impide escribir una
  // fila con otro organizador_id, pero no comprueba que el torneo referenciado
  // sea suyo: sin esto, un admin podría colgar un gasto del torneo de otro club.
  if (torneoId) {
    const { data: torneo } = await supabase
      .from("torneos")
      .select("id")
      .eq("id", torneoId)
      .eq("organizador_id", admin.organizador_id)
      .maybeSingle();
    if (!torneo) return { ok: false, error: "El torneo no existe." };
  }

  const user = await getUsuarioActual();
  const { error } = await supabase.from("movimientos_economicos").insert({
    organizador_id: admin.organizador_id,
    torneo_id: torneoId,
    tipo,
    categoria,
    concepto,
    importe_cents: importeCents,
    fecha,
    notas: String(formData.get("notas") ?? "").trim() || null,
    created_by: user?.id ?? null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/economia");
  if (torneoId) revalidatePath(`/admin/economia/${torneoId}`);
  return { ok: true, error: null };
}

export async function eliminarMovimiento(movimientoId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin?.organizador_id) return;

  const supabase = await createClient();
  const { data: movimiento } = await supabase
    .from("movimientos_economicos")
    .select("torneo_id")
    .eq("id", movimientoId)
    .maybeSingle();

  await supabase.from("movimientos_economicos").delete().eq("id", movimientoId);

  revalidatePath("/admin/economia");
  if (movimiento?.torneo_id) revalidatePath(`/admin/economia/${movimiento.torneo_id}`);
}
