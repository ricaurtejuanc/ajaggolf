"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { enviarEmailInscripcionRecibida } from "@/lib/email";
import { obtenerOrganizadorPorId, obtenerOrganizadorIdActual } from "@/lib/data/organizador";

export async function quitarDelCarrito(inscripcionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("inscripciones")
    .delete()
    .eq("id", inscripcionId)
    .eq("estado", "carrito");

  revalidatePath("/carrito");
}

export async function finalizarPedido(
  _prevState: unknown,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/carrito");

  const metodoPago = String(formData.get("metodo_pago") ?? "bizum").trim();
  if (!["bizum", "transferencia"].includes(metodoPago)) {
    return { ok: false, error: "Método de pago inválido." };
  }

  const organizadorId = await obtenerOrganizadorIdActual();
  const { data: jugador } = await supabase
    .from("jugadores")
    .select("id, nombre, email")
    .eq("user_id", user.id)
    .eq("organizador_id", organizadorId as string)
    .maybeSingle();
  if (!jugador) redirect("/carrito");

  const { data: itemsData } = await supabase
    .from("inscripciones")
    .select("id, precio_cents, torneos(nombre, fecha, organizador_id)")
    .eq("jugador_id", jugador.id)
    .eq("estado", "carrito");

  const items = (itemsData ?? []) as unknown as {
    id: string;
    precio_cents: number;
    torneos: { nombre: string; fecha: string; organizador_id: string | null } | null;
  }[];

  if (items.length === 0) redirect("/carrito");

  const total_cents = items.reduce((acc, item) => acc + item.precio_cents, 0);

  const { data: pedido, error } = await supabase
    .from("pedidos_pago")
    .insert({ user_id: user.id, metodo_pago: metodoPago as "bizum" | "transferencia", total_cents })
    .select("id")
    .single();

  if (error || !pedido) redirect("/carrito");

  await supabase
    .from("inscripciones")
    .update({ estado: "pendiente_pago", pedido_pago_id: pedido.id })
    .in(
      "id",
      items.map((i) => i.id),
    );

  if (jugador.email) {
    // Un carrito casi siempre es de un único club (se navega desde su
    // sitio); si por lo que sea mezclara torneos de organizadores
    // distintos, se usa el del primero como marca del email.
    const organizador = await obtenerOrganizadorPorId(supabase, items[0]?.torneos?.organizador_id ?? null);
    await enviarEmailInscripcionRecibida({
      destinatario: jugador.email,
      nombre: jugador.nombre,
      items: items.map((item) => ({
        torneoNombre: item.torneos?.nombre ?? "Torneo",
        torneoFecha: item.torneos?.fecha ?? new Date().toISOString().slice(0, 10),
        precioCents: item.precio_cents,
      })),
      organizador,
    });
  }

  redirect("/cuenta");
}
