import type { Metadata } from "next";
import type { ComponentProps } from "react";
import { createClient } from "@/lib/supabase/server";
import { PedidoRow } from "./pedido-row";

export const metadata: Metadata = { title: "Pagos · Admin" };

type PedidoConDetalle = ComponentProps<typeof PedidoRow>["pedido"];

export default async function AdminPedidosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pedidos_pago")
    .select(
      "*, inscripciones(id, es_socio, precio_cents, torneos(nombre), jugadores(nombre, email))",
    )
    .order("created_at", { ascending: false });

  const pedidos = (data ?? []) as unknown as PedidoConDetalle[];

  const pendientes = pedidos.filter(
    (p) => p.estado === "pendiente_confirmacion" || p.estado === "marcado_pagado",
  );
  const resueltos = pedidos.filter(
    (p) => p.estado === "confirmado" || p.estado === "rechazado" || p.estado === "cancelado",
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">Pagos</h1>

      <h2 className="mb-3 mt-6 text-sm font-medium uppercase tracking-wide text-ajag-gris-500">
        Por confirmar ({pendientes.length})
      </h2>
      <div className="flex flex-col gap-4">
        {pendientes.length === 0 ? (
          <p className="text-sm text-ajag-gris-500">No hay pagos pendientes.</p>
        ) : (
          pendientes.map((pedido) => (
            <PedidoRow key={pedido.id} pedido={pedido} />
          ))
        )}
      </div>

      {resueltos.length > 0 ? (
        <>
          <h2 className="mb-3 mt-10 text-sm font-medium uppercase tracking-wide text-ajag-gris-500">
            Historial
          </h2>
          <div className="flex flex-col gap-4">
            {resueltos.map((pedido) => (
              <PedidoRow
                key={pedido.id}
                pedido={pedido as unknown as ComponentProps<typeof PedidoRow>["pedido"]}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
