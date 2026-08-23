"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";

export async function confirmarPago(pedidoId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  await supabase
    .from("pedidos_pago")
    .update({
      estado: "confirmado",
      confirmado_at: new Date().toISOString(),
      confirmado_por: admin.id,
    })
    .eq("id", pedidoId);

  await supabase
    .from("inscripciones")
    .update({ estado: "confirmada" })
    .eq("pedido_pago_id", pedidoId);

  revalidatePath("/admin/pedidos");
}

export async function rechazarPago(pedidoId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  await supabase
    .from("pedidos_pago")
    .update({ estado: "rechazado", confirmado_por: admin.id })
    .eq("id", pedidoId);

  await supabase
    .from("inscripciones")
    .update({ estado: "cancelada" })
    .eq("pedido_pago_id", pedidoId);

  revalidatePath("/admin/pedidos");
}
