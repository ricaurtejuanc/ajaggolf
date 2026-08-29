"use client";

import { useActionState } from "react";
import { actualizarDatosPago, type EstadoConfiguracion } from "./actions";

export function MetodosPagoForm({
  bizumNumero,
  bizumNombre,
  transferenciaNumero,
  transferenciaNombre,
}: {
  bizumNumero: string | null;
  bizumNombre: string | null;
  transferenciaNumero: string | null;
  transferenciaNombre: string | null;
}) {
  const [state, formAction, pending] = useActionState<EstadoConfiguracion, FormData>(
    actualizarDatosPago,
    { ok: false, error: null },
  );

  return (
    <form action={formAction} className="card-ajag flex max-w-2xl flex-col gap-5 p-6">
      <h2 className="font-display text-lg font-semibold text-ajag-verde-900">
        Métodos de pago
      </h2>

      <div className="border-b border-ajag-gris-100 pb-5">
        <h3 className="mb-4 text-sm font-medium text-ajag-verde-900">Bizum</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bizum_numero" className="text-sm font-medium text-ajag-verde-900">
              Número de teléfono
            </label>
            <input
              id="bizum_numero"
              name="bizum_numero"
              placeholder="Ej. 633 88 10 27"
              defaultValue={bizumNumero ?? ""}
              className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
            />
          </div>
          <div>
            <label htmlFor="bizum_nombre" className="text-sm font-medium text-ajag-verde-900">
              A nombre de
            </label>
            <input
              id="bizum_nombre"
              name="bizum_nombre"
              placeholder="Ej. Club de Golf"
              defaultValue={bizumNombre ?? ""}
              className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-ajag-gris-500">
          Se muestra a los jugadores en el paso de pago de su pedido.
        </p>
      </div>

      <div className="pb-5">
        <h3 className="mb-4 text-sm font-medium text-ajag-verde-900">Transferencia bancaria</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="transferencia_numero"
              className="text-sm font-medium text-ajag-verde-900"
            >
              Número de cuenta
            </label>
            <input
              id="transferencia_numero"
              name="transferencia_numero"
              placeholder="Ej. ES91 2100 0418 4502 0005 1332"
              defaultValue={transferenciaNumero ?? ""}
              className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
            />
          </div>
          <div>
            <label
              htmlFor="transferencia_nombre"
              className="text-sm font-medium text-ajag-verde-900"
            >
              A nombre de
            </label>
            <input
              id="transferencia_nombre"
              name="transferencia_nombre"
              placeholder="Ej. Club de Golf"
              defaultValue={transferenciaNombre ?? ""}
              className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-ajag-gris-500">
          Se muestra a los jugadores en el paso de pago de su pedido.
        </p>
      </div>

      {state.error ? <p className="text-sm text-ajag-rojo-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-ajag-verde-700">Actualizado.</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-ajag-verde-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
