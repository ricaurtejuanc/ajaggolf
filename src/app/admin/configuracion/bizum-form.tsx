"use client";

import { useActionState } from "react";
import { actualizarBizumNumero, type EstadoConfiguracion } from "./actions";

export function BizumForm({ numeroActual }: { numeroActual: string }) {
  const [state, formAction, pending] = useActionState<EstadoConfiguracion, FormData>(
    actualizarBizumNumero,
    { ok: false, error: null },
  );

  return (
    <form action={formAction} className="card-ajag flex max-w-sm flex-col gap-3 p-5">
      <label htmlFor="bizum_numero" className="text-sm font-medium text-ajag-verde-900">
        Número de Bizum
      </label>
      <input
        id="bizum_numero"
        name="bizum_numero"
        defaultValue={numeroActual}
        required
        className="rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
      />
      <p className="text-xs text-ajag-gris-500">
        Se muestra a los jugadores en el paso de pago de su pedido.
      </p>
      {state.error ? <p className="text-sm text-ajag-rojo-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-ajag-verde-700">Actualizado.</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-ajag-verde-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
