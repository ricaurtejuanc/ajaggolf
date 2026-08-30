import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PedidoRow } from "../../pedidos/pedido-row";
import type { PedidoPago } from "@/types/database";

interface Inscripcion {
  id: string;
  es_socio: boolean;
  precio_cents: number;
  jugadores: { nombre: string; apellidos: string; email: string | null } | null;
}

interface PedidoConDetalle extends PedidoPago {
  inscripciones: Inscripcion[];
}

export default async function AdminTorneoPagosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: torneoId } = await params;
  const supabase = await createClient();

  const [{ data: torneo }, { data: pedidos }] = await Promise.all([
    supabase
      .from("torneos")
      .select("id, nombre")
      .eq("id", torneoId)
      .maybeSingle(),
    supabase
      .from("pedidos_pago")
      .select("*, inscripciones(id, es_socio, precio_cents, jugadores(nombre, apellidos, email))")
      .eq("torneo_id", torneoId)
      .order("created_at", { ascending: false }),
  ]);

  if (!torneo) notFound();

  const pedidosData = (pedidos ?? []) as unknown as PedidoConDetalle[];
  const pendientes = pedidosData.filter(
    (p) => p.estado === "pendiente_confirmacion" || p.estado === "marcado_pagado",
  );
  const resueltos = pedidosData.filter(
    (p) => p.estado === "confirmado" || p.estado === "rechazado" || p.estado === "cancelado",
  );

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/pedidos" className="text-sm text-ajag-gris-500 hover:underline">
          ← Todos los pagos
        </Link>
      </div>

      <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">{torneo.nombre}</h1>
      <p className="mt-1 text-sm text-ajag-gris-500">Pagos de inscripción</p>

      {pendientes.length > 0 ? (
        <div className="mt-6">
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
        <div className={pendientes.length > 0 ? "mt-10" : "mt-6"}>
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

      {pedidosData.length === 0 ? (
        <p className="mt-6 text-sm text-ajag-gris-500">No hay pagos para este torneo.</p>
      ) : null}
    </div>
  );
}
