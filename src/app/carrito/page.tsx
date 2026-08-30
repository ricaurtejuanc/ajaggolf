import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { obtenerCarrito } from "@/lib/data/carrito";
import { formatearPrecio } from "@/lib/format";
import { obtenerDatosPago } from "@/lib/data/configuracion";
import { obtenerOrganizadorIdActual } from "@/lib/data/organizador";
import { ItemCarritoRow } from "./item-carrito";
import { OpcionesPago } from "./opciones-pago";
import { finalizarPedido } from "./actions";

export const metadata: Metadata = { title: "Mi carrito" };

export default async function CarritoPage({
  searchParams,
}: {
  searchParams: Promise<{ inscrito?: string }>;
}) {
  const { inscrito } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/carrito");

  const organizadorId = await obtenerOrganizadorIdActual();
  const { data: jugador } = await supabase
    .from("jugadores")
    .select("id")
    .eq("user_id", user.id)
    .eq("organizador_id", organizadorId as string)
    .maybeSingle();

  const items = jugador ? await obtenerCarrito(jugador.id) : [];
  const total = items.reduce((acc, item) => acc + item.precio_cents, 0);
  const datosPago = await obtenerDatosPago();

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">Mi carrito</h1>

      {inscrito === "1" ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-ajag-verde-50 px-4 py-3 text-sm font-medium text-ajag-verde-900">
          <CheckCircle2 size={18} className="shrink-0 text-ajag-verde-700" />
          Tu inscripción se ha añadido correctamente. Te hemos enviado un email; confirma el
          pago aquí abajo para dejarla en firme.
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="card-ajag mt-6 p-8 text-center text-ajag-gris-500">
          Tu carrito está vacío.{" "}
          <Link href="/torneos" className="font-medium text-ajag-verde-700 underline">
            Ver calendario de torneos
          </Link>
        </div>
      ) : (
        <div className="card-ajag mt-6 p-5">
          <ul className="divide-y divide-ajag-gris-100">
            {items.map((item) => (
              <ItemCarritoRow key={item.id} item={item} />
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between border-t border-ajag-gris-100 pt-4">
            <span className="font-medium text-ajag-verde-900">Total</span>
            <span className="font-display text-xl font-semibold text-ajag-verde-900">
              {formatearPrecio(total)}
            </span>
          </div>

          {datosPago && <OpcionesPago datosPago={datosPago} />}
        </div>
      )}
    </div>
  );
}
