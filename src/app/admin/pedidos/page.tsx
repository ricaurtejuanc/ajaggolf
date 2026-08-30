import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { obtenerOrganizadorIdActual } from "@/lib/data/organizador";
import { PedidoRow } from "./pedido-row";
import type { PedidoPago } from "@/types/database";

export const metadata: Metadata = { title: "Pagos · Admin" };

interface Inscripcion {
  id: string;
  es_socio: boolean;
  precio_cents: number;
  jugadores: { nombre: string; apellidos: string; email: string | null } | null;
}

interface PedidoConTorneo extends PedidoPago {
  torneos: { id: string; nombre: string } | null;
  inscripciones: Inscripcion[];
}

export default async function AdminPedidosPage() {
  const supabase = await createClient();
  const organizadorIdActual = await obtenerOrganizadorIdActual();

  let query = supabase
    .from("pedidos_pago")
    .select(
      "*, torneos(id, nombre), inscripciones(id, es_socio, precio_cents, jugadores(nombre, apellidos, email))",
    );

  if (organizadorIdActual) {
    query = query.eq("torneos.organizador_id", organizadorIdActual);
  }

  const { data } = await query.order("created_at", { ascending: false });

  const pedidos = (data ?? []) as unknown as PedidoConTorneo[];

  const pendientes = pedidos.filter(
    (p) => p.estado === "pendiente_confirmacion" || p.estado === "marcado_pagado",
  );
  const resueltos = pedidos.filter(
    (p) => p.estado === "confirmado" || p.estado === "rechazado" || p.estado === "cancelado",
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">Pagos pendientes</h1>
      <p className="mt-1 text-sm text-ajag-gris-500">Accede a los pagos desde cada torneo</p>

      {pendientes.length === 0 && resueltos.length === 0 ? (
        <p className="mt-6 text-sm text-ajag-gris-500">No hay pagos registrados.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          {pendientes.length > 0 ? (
            <div>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-ajag-gris-500">
                Por confirmar ({pendientes.length})
              </h2>
              <div className="flex flex-col gap-4">
                {pendientes.map((pedido) => (
                  <PedidoRow key={pedido.id} pedido={pedido as any} />
                ))}
              </div>
            </div>
          ) : null}

          {resueltos.length > 0 ? (
            <div>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-ajag-gris-500">
                Historial ({resueltos.length})
              </h2>
              <div className="flex flex-col gap-4">
                {resueltos.map((pedido) => (
                  <PedidoRow key={pedido.id} pedido={pedido as any} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
