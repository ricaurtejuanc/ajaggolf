"use client";

import { useTransition } from "react";
import { confirmarPago, eliminarPedido, rechazarPago } from "./actions";
import { formatearPrecio, formatearFechaCorta } from "@/lib/format";
import type { EstadoPedidoPago } from "@/types/database";

interface Inscripcion {
  id: string;
  es_socio: boolean;
  precio_cents: number;
  torneos: { nombre: string } | null;
  jugadores: { nombre: string; apellidos: string; email: string | null } | null;
}

interface Pedido {
  id: string;
  estado: EstadoPedidoPago;
  total_cents: number;
  created_at: string;
  marcado_pagado_at: string | null;
  inscripciones: Inscripcion[];
}

const etiquetaEstado: Record<EstadoPedidoPago, { texto: string; clase: string }> = {
  pendiente_confirmacion: { texto: "Pendiente", clase: "bg-ajag-gris-100 text-ajag-gris-500" },
  marcado_pagado: { texto: "Marcado como pagado", clase: "bg-ajag-oro-500/20 text-ajag-oro-600" },
  confirmado: { texto: "Confirmado", clase: "bg-ajag-verde-700 text-white" },
  rechazado: { texto: "Rechazado", clase: "bg-ajag-rojo-600/10 text-ajag-rojo-600" },
  cancelado: { texto: "Cancelado", clase: "bg-ajag-gris-100 text-ajag-gris-500" },
};

export function PedidoRow({ pedido }: { pedido: Pedido }) {
  const [pending, startTransition] = useTransition();
  const estado = etiquetaEstado[pedido.estado];
  const accionable = pedido.estado === "marcado_pagado" || pedido.estado === "pendiente_confirmacion";

  return (
    <div className="card-ajag p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-ajag-gris-500">
            Pedido del {formatearFechaCorta(pedido.created_at.slice(0, 10))}
            {pedido.marcado_pagado_at
              ? ` · marcado como pagado el ${formatearFechaCorta(pedido.marcado_pagado_at.slice(0, 10))}`
              : ""}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${estado.clase}`}>
          {estado.texto}
        </span>
      </div>

      <ul className="mt-3 space-y-1 text-sm text-ajag-verde-900">
        {pedido.inscripciones.map((insc) => (
          <li key={insc.id} className="flex justify-between gap-4">
            <span>
              {insc.jugadores
                ? `${insc.jugadores.nombre} ${insc.jugadores.apellidos}`.trim()
                : "Jugador"}{" "}
              — {insc.torneos?.nombre ?? "Torneo"}
              {insc.es_socio ? (
                <span className="ml-1.5 rounded-full bg-ajag-verde-50 px-2 py-0.5 text-xs font-medium text-ajag-verde-700">
                  socio
                </span>
              ) : null}
            </span>
            <span className="text-ajag-gris-500">{formatearPrecio(insc.precio_cents)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-ajag-gris-100 pt-3">
        <span className="font-display text-lg font-semibold text-ajag-verde-900">
          {formatearPrecio(pedido.total_cents)}
        </span>

        <div className="flex gap-1.5">
          {accionable ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (confirm("¿Cancelar este pedido? Quedará marcado como cancelado y liberará las plazas.")) {
                    startTransition(() => rechazarPago(pedido.id));
                  }
                }}
                className="rounded-lg border border-ajag-rojo-600 px-2.5 py-1 text-xs font-medium text-ajag-rojo-600 transition hover:bg-ajag-rojo-600/10 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => confirmarPago(pedido.id))}
                className="rounded-lg bg-ajag-verde-700 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-50"
              >
                Confirmar
              </button>
            </>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (confirm("¿Eliminar este pedido y sus inscripciones? No se puede deshacer.")) {
                startTransition(() => eliminarPedido(pedido.id));
              }
            }}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-ajag-gris-500 transition hover:bg-ajag-rojo-600/10 hover:text-ajag-rojo-600 disabled:opacity-50"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
