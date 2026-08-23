"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function marcarPedidoComoPagadoInvitado(pedidoId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("pedidos_pago")
    .update({ estado: "marcado_pagado", marcado_pagado_at: new Date().toISOString() })
    .eq("id", pedidoId)
    .is("user_id", null)
    .eq("estado", "pendiente_confirmacion");

  if (error) throw error;
}
