"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { crearMovimiento, type EstadoMovimientoForm } from "./actions";
import { CATEGORIAS } from "@/lib/economia/categorias";
import type { TipoMovimiento } from "@/types/database";

const claseCampo =
  "mt-1 w-full rounded-xl border border-ajag-gris-200 bg-white px-3 py-2 text-sm outline-none focus:border-ajag-verde-600";

/**
 * Alta rápida de un movimiento. Se usa igual en el resumen general (sin
 * torneoId: el movimiento queda como gasto/ingreso de estructura) y en la
 * ficha de un torneo (con torneoId fijo).
 */
export function MovimientoForm({
  torneoId,
  fechaSugerida,
}: {
  torneoId?: string;
  /** Fecha con la que se precarga el campo (la del torneo, o hoy). */
  fechaSugerida: string;
}) {
  const [state, formAction, pending] = useActionState<EstadoMovimientoForm, FormData>(
    crearMovimiento,
    { ok: false, error: null },
  );
  const [tipo, setTipo] = useState<TipoMovimiento>("gasto");
  const formRef = useRef<HTMLFormElement>(null);

  // Tras guardar se limpia el formulario para poder encadenar varias altas
  // seguidas (es lo normal al pasar a limpio las facturas de un torneo).
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="card-ajag p-5">
      <h2 className="font-display text-base font-semibold text-ajag-verde-900">
        Añadir movimiento
      </h2>

      <div className="mt-3 flex gap-2">
        {(["gasto", "ingreso"] as const).map((valor) => (
          <label
            key={valor}
            className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-medium transition ${
              tipo === valor
                ? valor === "gasto"
                  ? "border-ajag-rojo-600 bg-ajag-rojo-600/10 text-ajag-rojo-600"
                  : "border-ajag-verde-600 bg-ajag-verde-50 text-ajag-verde-900"
                : "border-ajag-gris-200 text-ajag-gris-500"
            }`}
          >
            <input
              type="radio"
              name="tipo"
              value={valor}
              checked={tipo === valor}
              onChange={() => setTipo(valor)}
              className="sr-only"
            />
            {valor === "gasto" ? "Gasto" : "Ingreso"}
          </label>
        ))}
      </div>

      {torneoId ? <input type="hidden" name="torneo_id" value={torneoId} /> : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="categoria" className="block text-sm font-medium text-ajag-verde-900">
            Categoría
          </label>
          {/* key fuerza a remontar el select al cambiar de tipo: si no, el
              navegador conserva el índice seleccionado y se quedaría marcada
              la categoría de la misma posición en la otra lista. */}
          <select key={tipo} id="categoria" name="categoria" className={claseCampo}>
            {CATEGORIAS[tipo].map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="importe" className="block text-sm font-medium text-ajag-verde-900">
            Importe (€)
          </label>
          <input
            id="importe"
            name="importe"
            inputMode="decimal"
            placeholder="0,00"
            className={claseCampo}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="concepto" className="block text-sm font-medium text-ajag-verde-900">
            Concepto
          </label>
          <input
            id="concepto"
            name="concepto"
            placeholder="Ej. Green fees Club de Campo"
            className={claseCampo}
          />
        </div>

        <div>
          <label htmlFor="fecha" className="block text-sm font-medium text-ajag-verde-900">
            Fecha
          </label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            defaultValue={fechaSugerida}
            className={claseCampo}
          />
        </div>

        <div>
          <label htmlFor="notas" className="block text-sm font-medium text-ajag-verde-900">
            Notas (opcional)
          </label>
          <input id="notas" name="notas" placeholder="Nº de factura, proveedor…" className={claseCampo} />
        </div>
      </div>

      {state.error ? <p className="mt-3 text-sm text-ajag-rojo-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-xl bg-ajag-verde-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Añadir"}
      </button>
    </form>
  );
}
