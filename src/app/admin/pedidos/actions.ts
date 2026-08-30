"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getUsuarioAdmin } from "@/lib/auth";
import { enviarEmailInscripcionConfirmada } from "@/lib/email";
import { obtenerOrganizadorPorId, obtenerOrganizadorIdActual } from "@/lib/data/organizador";

// Borra el pedido y las inscripciones que llevaba (un pedido rechazado o
// eliminado no debe dejar rastro: ni ocupar cupo ni quedar como
// "Rechazado" en el historial — el admin quiere que desaparezca, igual
// que al eliminar).
//
// Se borra el pedido antes que sus inscripciones (la FK `on delete set
// null` en inscripciones.pedido_pago_id limpia esa columna sin pasar por
// RLS) y solo entonces se borran las inscripciones por id: si se hiciera
// al revés, un pedido cuya única vía de organizador fueran esas
// inscripciones se quedaría sin forma de autorizar su propio delete.
async function borrarPedidoYInscripciones(supabase: SupabaseClient, pedidoId: string) {
  const { data: inscripciones } = await supabase
    .from("inscripciones")
    .select("id")
    .eq("pedido_pago_id", pedidoId);

  await supabase.from("pedidos_pago").delete().eq("id", pedidoId);

  const ids = (inscripciones ?? []).map((i) => i.id);
  if (ids.length > 0) {
    await supabase.from("inscripciones").delete().in("id", ids);
  }
}

// pedidos_pago puede llevar su organizador de dos formas: por su propio
// torneo_id (pedidos nuevos, desde "pagos por torneo"), o por el torneo de
// sus inscripciones (pedidos antiguos, o uno cuyas inscripciones ya se
// borraron pero el registro del torneo sigue). Hay que comprobar las dos
// vías — comprobar solo una bloqueaba en falso pedidos legítimos que no
// tenían esa vía concreta rellena (justo lo que impedía borrar pagos desde
// el admin).
function organizadoresDelPedido(pedido: {
  torneos?: { organizador_id: string | null } | null;
  inscripciones?: { torneos?: { organizador_id: string | null } | null } | { torneos?: { organizador_id: string | null } | null }[] | null;
}): (string | null | undefined)[] {
  const inscripciones = Array.isArray(pedido.inscripciones)
    ? pedido.inscripciones
    : pedido.inscripciones
      ? [pedido.inscripciones]
      : [];
  return [pedido.torneos?.organizador_id, ...inscripciones.map((i) => i.torneos?.organizador_id)];
}

export async function confirmarPago(pedidoId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  const organizadorIdActual = await obtenerOrganizadorIdActual();

  const { data: pedidoDataRaw } = await supabase
    .from("pedidos_pago")
    .select(
      "torneos(organizador_id), inscripciones(precio_cents, torneos(nombre, fecha, organizador_id), jugadores(nombre, email))",
    )
    .eq("id", pedidoId)
    .maybeSingle();
  const pedidoData = pedidoDataRaw as unknown as {
    torneos: { organizador_id: string | null } | null;
    inscripciones: {
      precio_cents: number;
      torneos: { nombre: string; fecha: string; organizador_id: string | null } | null;
      jugadores: { nombre: string; email: string | null } | null;
    }[];
  } | null;

  if (
    !pedidoData?.inscripciones?.[0] ||
    (organizadorIdActual && !organizadoresDelPedido(pedidoData).includes(organizadorIdActual))
  ) {
    return;
  }

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
  const organizadorIdActual = await obtenerOrganizadorIdActual();

  // Validar que el pedido pertenece al organizador actual
  const { data: pedidoRaw } = await supabase
    .from("pedidos_pago")
    .select("torneos(organizador_id), inscripciones(torneos(organizador_id))")
    .eq("id", pedidoId)
    .maybeSingle();
  const pedido = pedidoRaw as unknown as {
    torneos: { organizador_id: string | null } | null;
    inscripciones: { torneos: { organizador_id: string | null } | null }[];
  } | null;

  if (!pedido || (organizadorIdActual && !organizadoresDelPedido(pedido).includes(organizadorIdActual))) {
    return;
  }

  await borrarPedidoYInscripciones(supabase, pedidoId);

  revalidatePath("/admin/pedidos");
}

// Para limpiar pedidos duplicados o de prueba desde el historial.
export async function eliminarPedido(pedidoId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  const organizadorIdActual = await obtenerOrganizadorIdActual();

  // Validar que el pedido pertenece al organizador actual
  const { data: pedidoRaw } = await supabase
    .from("pedidos_pago")
    .select("torneos(organizador_id), inscripciones(torneos(organizador_id))")
    .eq("id", pedidoId)
    .maybeSingle();
  const pedido = pedidoRaw as unknown as {
    torneos: { organizador_id: string | null } | null;
    inscripciones: { torneos: { organizador_id: string | null } | null }[];
  } | null;

  if (!pedido || (organizadorIdActual && !organizadoresDelPedido(pedido).includes(organizadorIdActual))) {
    return;
  }

  await borrarPedidoYInscripciones(supabase, pedidoId);

  revalidatePath("/admin/pedidos");
}
