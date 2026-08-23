import { createClient } from "@/lib/supabase/server";

export type ItemCarrito = {
  id: string;
  precio_cents: number;
  torneo_id: string;
  torneos: { nombre: string; slug: string; fecha: string; poster_url: string | null } | null;
};

export async function obtenerCarrito(jugadorId: string): Promise<ItemCarrito[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inscripciones")
    .select("id, precio_cents, torneo_id, torneos(nombre, slug, fecha, poster_url)")
    .eq("jugador_id", jugadorId)
    .eq("estado", "carrito")
    .order("created_at", { ascending: true });

  return (data ?? []) as unknown as ItemCarrito[];
}
