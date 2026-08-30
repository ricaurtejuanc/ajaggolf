"use client";

import { useActionState, useEffect, useState } from "react";
import { actualizarMovimiento, type EstadoMovimientoForm } from "./actions";
import { EliminarMovimientoButton } from "./eliminar-movimiento-button";
import { CATEGORIAS, etiquetaCategoria } from "@/lib/economia/categorias";
import { formatearPrecio, formatearFechaCorta } from "@/lib/format";
import type { MovimientoEconomico, TipoMovimiento } from "@/types/database";

const claseCampo =
  "w-full rounded-lg border border-ajag-gris-200 bg-white px-3 py-2 text-sm outline-none focus:border-ajag-verde-600";

/** Céntimos → el texto editable del input ("1500,00"). */
function centimosAtexto(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function FilaEdicion({
  movimiento,
  onCerrar,
}: {
  movimiento: MovimientoEconomico;
  onCerrar: () => void;
}) {
  const accion = actualizarMovimiento.bind(null, movimiento.id);
  const [state, formAction, pending] = useActionState<EstadoMovimientoForm, FormData>(accion, {
    ok: false,
    error: null,
  });
  const [tipo, setTipo] = useState<TipoMovimiento>(movimiento.tipo);

  // La fila vuelve a modo lectura sola en cuanto el guardado va bien, para
  // que el admin vea el importe ya actualizado sin tener que cerrar nada.
  useEffect(() => {
    if (state.ok) onCerrar();
  }, [state.ok, onCerrar]);

  return (
    <tr className="border-b border-ajag-gris-100 bg-ajag-verde-50/40 last:border-0">
      <td colSpan={5} className="px-4 py-4">
        <form action={formAction}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-medium text-ajag-verde-900">
              Tipo
              <select
                name="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoMovimiento)}
                className={`mt-1 ${claseCampo}`}
              >
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </label>

            <label className="text-xs font-medium text-ajag-verde-900">
              Categoría
              {/* key: al cambiar de tipo cambia la lista de opciones, y sin
                  remontar el select el navegador conservaría el índice. */}
              <select
                key={tipo}
                name="categoria"
                defaultValue={tipo === movimiento.tipo ? movimiento.categoria : undefined}
                className={`mt-1 ${claseCampo}`}
              >
                {CATEGORIAS[tipo].map((c) => (
                  <option key={c.valor} value={c.valor}>
                    {c.etiqueta}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-ajag-verde-900">
              Importe (€)
              <input
                name="importe"
                inputMode="decimal"
                defaultValue={centimosAtexto(movimiento.importe_cents)}
                className={`mt-1 ${claseCampo}`}
              />
            </label>

            <label className="text-xs font-medium text-ajag-verde-900">
              Fecha
              <input
                name="fecha"
                type="date"
                defaultValue={movimiento.fecha}
                className={`mt-1 ${claseCampo}`}
              />
            </label>

            <label className="text-xs font-medium text-ajag-verde-900 sm:col-span-2">
              Concepto
              <input
                name="concepto"
                defaultValue={movimiento.concepto}
                className={`mt-1 ${claseCampo}`}
              />
            </label>

            <label className="text-xs font-medium text-ajag-verde-900 sm:col-span-2">
              Notas
              <input
                name="notas"
                defaultValue={movimiento.notas ?? ""}
                className={`mt-1 ${claseCampo}`}
              />
            </label>
          </div>

          {state.error ? <p className="mt-2 text-sm text-ajag-rojo-600">{state.error}</p> : null}

          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-ajag-verde-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
            >
              {pending ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-xl border border-ajag-gris-200 px-4 py-2 text-sm font-medium text-ajag-gris-500 transition hover:bg-ajag-gris-100"
            >
              Cancelar
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}

/** Tabla de movimientos manuales, con edición en línea y borrado. */
export function TablaMovimientos({
  movimientos,
  vacio,
}: {
  movimientos: MovimientoEconomico[];
  vacio: string;
}) {
  const [editando, setEditando] = useState<string | null>(null);

  if (movimientos.length === 0) {
    return <div className="card-ajag p-6 text-center text-sm text-ajag-gris-500">{vacio}</div>;
  }

  return (
    <div className="card-ajag overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-ajag-gris-100 text-xs uppercase tracking-wide text-ajag-gris-500">
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Concepto</th>
            <th className="px-4 py-3 font-medium">Categoría</th>
            <th className="px-4 py-3 text-right font-medium">Importe</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {movimientos.map((m) =>
            editando === m.id ? (
              <FilaEdicion key={m.id} movimiento={m} onCerrar={() => setEditando(null)} />
            ) : (
              <tr key={m.id} className="border-b border-ajag-gris-100 last:border-0">
                <td className="px-4 py-3 whitespace-nowrap text-ajag-gris-500">
                  {formatearFechaCorta(m.fecha)}
                </td>
                <td className="px-4 py-3 font-medium text-ajag-verde-900">
                  {m.concepto}
                  {m.notas ? (
                    <span className="block text-xs font-normal text-ajag-gris-500">{m.notas}</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-ajag-gris-500">
                  {etiquetaCategoria(m.tipo, m.categoria)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                    m.tipo === "ingreso" ? "text-ajag-verde-700" : "text-ajag-rojo-600"
                  }`}
                >
                  {m.tipo === "ingreso" ? "+" : "−"} {formatearPrecio(m.importe_cents)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setEditando(m.id)}
                      className="text-sm font-medium text-ajag-verde-700 hover:underline"
                    >
                      Editar
                    </button>
                    <EliminarMovimientoButton movimientoId={m.id} />
                  </div>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
