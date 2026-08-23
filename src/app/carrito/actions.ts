"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

export async function finalizarPedido() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/carrito");

  const { data: jugador } = await supabase
    .from("jugadores")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!jugador) redirect("/carrito");

  const { data: items } = await supabase
    .from("inscripciones")
    .select("id, precio_cents")
    .eq("jugador_id", jugador.id)
    .eq("estado", "carrito");

  if (!items || items.length === 0) redirect("/carrito");

  const total_cents = items.reduce((acc, item) => acc + item.precio_cents, 0);

  const { data: pedido, error } = await supabase
    .from("pedidos_pago")
    .insert({ user_id: user.id, metodo_pago: "bizum", total_cents })
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

  redirect("/cuenta");
}
