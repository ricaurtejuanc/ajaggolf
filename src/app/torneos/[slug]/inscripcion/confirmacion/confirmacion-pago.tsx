"use client";

import { useState, useTransition } from "react";
import { obtenerProveedorPago } from "@/lib/pagos";
import { formatearPrecio } from "@/lib/format";
import { marcarPedidoComoPagadoInvitado } from "./actions";
import type { EstadoPedidoPago } from "@/types/database";

export function ConfirmacionPago({
  pedidoId,
  totalCents,
  estadoInicial,
  bizumNumero,
}: {
  pedidoId: string;
  totalCents: number;
  estadoInicial: EstadoPedidoPago;
  bizumNumero: string;
}) {
  const [estado, setEstado] = useState(estadoInicial);
  const [pending, startTransition] = useTransition();

  if (estado !== "pendiente_confirmacion") {
    return (
      <div className="card-ajag mt-4 p-5 text-center text-sm text-ajag-verde-900">
        Hemos recibido tu aviso de pago. El organizador confirmará el ingreso
        en breve.
      </div>
    );
  }

  const instrucciones = obtenerProveedorPago("bizum").obtenerInstrucciones({
    totalCents,
    bizumNumero,
    ubicacionConfirmacion: "esta página",
  });

  return (
    <div className="card-ajag mt-4 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ajag-verde-900">Total a pagar</span>
        <span className="font-display text-lg font-semibold text-ajag-verde-900">
          {formatearPrecio(totalCents)}
        </span>
      </div>

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
          onClick={() =>
            startTransition(async () => {
              await marcarPedidoComoPagadoInvitado(pedidoId);
              setEstado("marcado_pagado");
            })
          }
          className="mt-3 rounded-lg bg-ajag-verde-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Ya he pagado"}
        </button>
      </div>
    </div>
  );
}
