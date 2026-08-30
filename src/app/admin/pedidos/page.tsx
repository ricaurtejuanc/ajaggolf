import type { Metadata } from "next";
import Link from "next/link";
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

  // Agrupar por torneo
  const pedidosPorTorneo = new Map<
    string,
    { torneo: { id: string; nombre: string }; pedidos: PedidoConTorneo[] }
  >();
  for (const pedido of pedidos) {
    const torneoKey = pedido.torneo_id ?? "sin_torneo";
    if (!pedidosPorTorneo.has(torneoKey)) {
      pedidosPorTorneo.set(torneoKey, {
        torneo: pedido.torneos || { id: "unknown", nombre: "Torneo desconocido" },
        pedidos: [],
      });
    }
    pedidosPorTorneo.get(torneoKey)!.pedidos.push(pedido);
  }

  const torneosOrdenados = Array.from(pedidosPorTorneo.values()).sort((a, b) =>
    b.pedidos[0].created_at.localeCompare(a.pedidos[0].created_at),
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">Pagos</h1>

      {torneosOrdenados.length === 0 ? (
        <p className="mt-6 text-sm text-ajag-gris-500">No hay pagos registrados.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          {torneosOrdenados.map(({ torneo, pedidos: pedidosTorneo }) => {
            const pendientes = pedidosTorneo.filter(
              (p) => p.estado === "pendiente_confirmacion" || p.estado === "marcado_pagado",
            );
            const resueltos = pedidosTorneo.filter(
              (p) => p.estado === "confirmado" || p.estado === "rechazado" || p.estado === "cancelado",
            );

            return (
              <div key={torneo.id}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-ajag-verde-900">
                    {torneo.nombre}
                  </h2>
                  <Link
                    href={`/admin/torneos/${torneo.id}/pagos`}
                    className="text-sm text-ajag-verde-700 hover:underline"
                  >
                    Ver en ficha del torneo
                  </Link>
                </div>

                {pendientes.length > 0 ? (
                  <div className="mb-4">
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-ajag-gris-500">
                      Por confirmar ({pendientes.length})
                    </h3>
                    <div className="flex flex-col gap-4">
                      {pendientes.map((pedido) => (
                        <PedidoRow key={pedido.id} pedido={pedido as any} />
                      ))}
                    </div>
                  </div>
                ) : null}

                {resueltos.length > 0 ? (
                  <div>
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-ajag-gris-500">
                      Historial ({resueltos.length})
                    </h3>
                    <div className="flex flex-col gap-4">
                      {resueltos.map((pedido) => (
                        <PedidoRow key={pedido.id} pedido={pedido as any} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
