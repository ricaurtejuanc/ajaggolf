"use client";

import { useTransition } from "react";
import { confirmarPago, rechazarPago } from "./actions";
import { formatearPrecio, formatearFechaCorta } from "@/lib/format";
import type { EstadoPedidoPago } from "@/types/database";

interface Inscripcion {
  id: string;
  torneos: { nombre: string } | null;
  jugadores: { nombre: string; email: string | null } | null;
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
              {insc.jugadores?.nombre ?? "Jugador"} — {insc.torneos?.nombre ?? "Torneo"}
            </span>
            <span className="text-ajag-gris-500">{insc.jugadores?.email}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-ajag-gris-100 pt-3">
        <span className="font-display text-lg font-semibold text-ajag-verde-900">
          {formatearPrecio(pedido.total_cents)}
        </span>

        {accionable ? (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => rechazarPago(pedido.id))}
              className="rounded-full border border-ajag-rojo-600 px-4 py-2 text-sm font-medium text-ajag-rojo-600 transition hover:bg-ajag-rojo-600/10 disabled:opacity-50"
            >
              Rechazar
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => confirmarPago(pedido.id))}
              className="rounded-full bg-ajag-verde-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-50"
            >
              Confirmar pago
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
