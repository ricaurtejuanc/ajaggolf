"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { enviarEmailInscripcionConfirmada } from "@/lib/email";

export async function confirmarPago(pedidoId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();

  const { data: pedidoDataRaw } = await supabase
    .from("pedidos_pago")
    .select("inscripciones(precio_cents, torneos(nombre, fecha), jugadores(nombre, email))")
    .eq("id", pedidoId)
    .maybeSingle();
  const pedidoData = pedidoDataRaw as unknown as {
    inscripciones: {
      precio_cents: number;
      torneos: { nombre: string; fecha: string } | null;
      jugadores: { nombre: string; email: string | null } | null;
    }[];
  } | null;

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

  const inscripciones = pedidoData?.inscripciones ?? [];
  const destinatario = inscripciones[0]?.jugadores?.email;
  if (destinatario) {
    await enviarEmailInscripcionConfirmada({
      destinatario,
      nombre: inscripciones[0]!.jugadores!.nombre,
      items: inscripciones.map((i) => ({
        torneoNombre: i.torneos?.nombre ?? "Torneo",
        torneoFecha: i.torneos?.fecha ?? new Date().toISOString().slice(0, 10),
        precioCents: i.precio_cents,
      })),
    });
  }

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
