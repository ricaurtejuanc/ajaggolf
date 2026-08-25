"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { enviarEmailInscripcionConfirmada } from "@/lib/email";
import { obtenerOrganizadorPorId } from "@/lib/data/organizador";

export async function confirmarPago(pedidoId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();

  const { data: pedidoDataRaw } = await supabase
    .from("pedidos_pago")
    .select(
      "inscripciones(precio_cents, torneos(nombre, fecha, organizador_id), jugadores(nombre, email))",
    )
    .eq("id", pedidoId)
    .maybeSingle();
  const pedidoData = pedidoDataRaw as unknown as {
    inscripciones: {
      precio_cents: number;
      torneos: { nombre: string; fecha: string; organizador_id: string | null } | null;
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
    const organizador = await obtenerOrganizadorPorId(
      supabase,
      inscripciones[0]?.torneos?.organizador_id ?? null,
    );
    await enviarEmailInscripcionConfirmada({
      destinatario,
      nombre: inscripciones[0]!.jugadores!.nombre,
      items: inscripciones.map((i) => ({
        torneoNombre: i.torneos?.nombre ?? "Torneo",
        torneoFecha: i.torneos?.fecha ?? new Date().toISOString().slice(0, 10),
        precioCents: i.precio_cents,
      })),
      organizador,
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

// Borra el pedido y las inscripciones que llevaba (un pedido sin
// inscripciones no tiene sentido guardarlo, y dejarlas huérfanas ocuparía
// cupo sin un pago detrás) — para limpiar pedidos duplicados o de prueba.
export async function eliminarPedido(pedidoId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  await supabase.from("inscripciones").delete().eq("pedido_pago_id", pedidoId);
  await supabase.from("pedidos_pago").delete().eq("id", pedidoId);

  revalidatePath("/admin/pedidos");
}
