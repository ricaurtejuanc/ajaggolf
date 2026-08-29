"use client";

import { useActionState, useState } from "react";
import { CreditCard, Smartphone, Banknote } from "lucide-react";
import { finalizarPedido } from "./actions";

type DatosPago = {
  bizum_numero: string | null;
  bizum_nombre: string | null;
  transferencia_numero: string | null;
  transferencia_nombre: string | null;
};

export function OpcionesPago({ datosPago }: { datosPago: DatosPago }) {
  const [state, formAction, pending] = useActionState(finalizarPedido, {
    ok: false,
    error: null,
  });
  const [metodoPago, setMetodoPago] = useState<string>("bizum");

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      <input type="hidden" name="metodo_pago" value={metodoPago} />

      <div className="space-y-3">
        {/* Bizum */}
        <label className="card-ajag flex items-center gap-4 border-2 border-ajag-gris-200 p-4 transition has-[:checked]:border-ajag-verde-600 has-[:checked]:bg-ajag-verde-50">
          <input
            type="radio"
            name="metodo_pago_radio"
            value="bizum"
            checked={metodoPago === "bizum"}
            onChange={(e) => setMetodoPago(e.target.value)}
            className="shrink-0"
          />
          <div className="flex items-start gap-3 flex-1">
            <Smartphone size={20} className="shrink-0 text-ajag-verde-700 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ajag-verde-900">Pagar con Bizum</p>
              {datosPago.bizum_numero && (
                <div className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-ajag-gris-600">
                  <p>Número: <span className="font-medium">{datosPago.bizum_numero}</span></p>
                  {datosPago.bizum_nombre && <p>A nombre de: <span className="font-medium">{datosPago.bizum_nombre}</span></p>}
                </div>
              )}
            </div>
          </div>
        </label>

        {/* Transferencia */}
        <label className="card-ajag flex items-center gap-4 border-2 border-ajag-gris-200 p-4 transition has-[:checked]:border-ajag-verde-600 has-[:checked]:bg-ajag-verde-50">
          <input
            type="radio"
            name="metodo_pago_radio"
            value="transferencia"
            checked={metodoPago === "transferencia"}
            onChange={(e) => setMetodoPago(e.target.value)}
            className="shrink-0"
          />
          <div className="flex items-start gap-3 flex-1">
            <Banknote size={20} className="shrink-0 text-ajag-verde-700 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ajag-verde-900">Pagar con Transferencia</p>
              {datosPago.transferencia_numero && (
                <div className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-ajag-gris-600">
                  <p>Cuenta: <span className="font-medium">{datosPago.transferencia_numero}</span></p>
                  {datosPago.transferencia_nombre && <p>A nombre de: <span className="font-medium">{datosPago.transferencia_nombre}</span></p>}
                </div>
              )}
            </div>
          </div>
        </label>

        {/* Tarjeta */}
        <label className="card-ajag flex items-center gap-4 border-2 border-ajag-gris-200 p-4 opacity-50 cursor-not-allowed">
          <input
            type="radio"
            disabled
            className="shrink-0"
          />
          <div className="flex items-start gap-3 flex-1">
            <CreditCard size={20} className="shrink-0 text-ajag-gris-400 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ajag-gris-500">Pagar con Tarjeta</p>
              <p className="mt-1 text-xs text-ajag-gris-400">Pronto podrás pagar con tarjeta</p>
            </div>
          </div>
        </label>
      </div>

      {state.error ? <p className="text-sm text-ajag-rojo-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full rounded-xl bg-ajag-verde-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
      >
        {pending ? "Finalizando..." : "Finalizar pedido"}
      </button>
    </form>
  );
}
