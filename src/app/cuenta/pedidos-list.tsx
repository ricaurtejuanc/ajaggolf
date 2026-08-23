"use client";

import { useTransition } from "react";
import { marcarPedidoComoPagado } from "./actions";
import { formatearPrecio, formatearFechaCorta } from "@/lib/format";
import { obtenerProveedorPago } from "@/lib/pagos";
import type { EstadoPedidoPago, MetodoPago } from "@/types/database";

interface InscripcionConTorneo {
  id: string;
  precio_cents: number;
  torneos: { nombre: string; slug: string; fecha: string } | null;
}

interface PedidoConDetalle {
  id: string;
  estado: EstadoPedidoPago;
  metodo_pago: MetodoPago;
  total_cents: number;
  created_at: string;
  inscripciones: InscripcionConTorneo[];
}

const etiquetaEstado: Record<EstadoPedidoPago, { texto: string; clase: string }> = {
  pendiente_confirmacion: { texto: "Pendiente de pago", clase: "bg-ajag-oro-500/20 text-ajag-oro-600" },
  marcado_pagado: { texto: "Pago enviado, esperando confirmación", clase: "bg-ajag-verde-100 text-ajag-verde-700" },
  confirmado: { texto: "Confirmado", clase: "bg-ajag-verde-700 text-white" },
  rechazado: { texto: "Rechazado", clase: "bg-ajag-rojo-600/10 text-ajag-rojo-600" },
  cancelado: { texto: "Cancelado", clase: "bg-ajag-gris-100 text-ajag-gris-500" },
};

export function PedidosList({
  pedidos,
  bizumNumero,
}: {
  pedidos: PedidoConDetalle[];
  bizumNumero: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <ul className="flex flex-col gap-4">
      {pedidos.map((pedido) => {
        const estado = etiquetaEstado[pedido.estado];
        const instrucciones =
          pedido.estado === "pendiente_confirmacion"
            ? obtenerProveedorPago(pedido.metodo_pago).obtenerInstrucciones({
                totalCents: pedido.total_cents,
                bizumNumero,
              })
            : null;

        return (
          <li key={pedido.id} className="card-ajag p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-ajag-gris-500">
                Pedido del {formatearFechaCorta(pedido.created_at.slice(0, 10))}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${estado.clase}`}>
                {estado.texto}
              </span>
            </div>

            <ul className="mt-3 space-y-1 text-sm text-ajag-verde-900">
              {pedido.inscripciones.map((insc) => (
                <li key={insc.id} className="flex justify-between">
                  <span>{insc.torneos?.nombre ?? "Torneo"}</span>
                  <span className="text-ajag-gris-500">{formatearPrecio(insc.precio_cents)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center justify-between border-t border-ajag-gris-100 pt-3">
              <span className="text-sm font-medium text-ajag-verde-900">Total</span>
              <span className="font-display text-lg font-semibold text-ajag-verde-900">
                {formatearPrecio(pedido.total_cents)}
              </span>
            </div>

            {instrucciones ? (
              <div className="mt-4 rounded-xl bg-ajag-verde-50 p-4">
                <p className="text-sm font-medium text-ajag-verde-900">{instrucciones.titulo}</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-ajag-gris-500">
                  {instrucciones.pasos.map((paso, i) => (
                    <li key={i}>{paso}</li>
                  ))}
                </ol>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => marcarPedidoComoPagado(pedido.id))}
                  className="mt-3 rounded-xl bg-ajag-verde-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
                >
                  {pending ? "Guardando..." : "Ya he pagado"}
                </button>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
