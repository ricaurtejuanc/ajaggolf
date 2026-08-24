"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { guardarResultados } from "./actions";
import { filaVacia, type FilaResultado } from "./fila-resultado";
import type { FormatoPuntuacion } from "@/types/database";

export interface CategoriaClasificacion {
  nombre: string;
  handicapDesde: number | null;
  handicapHasta: number | null;
}

export function ResultadosForm({
  torneoId,
  formatoPuntuacion,
  filasIniciales,
  categorias = [],
}: {
  torneoId: string;
  formatoPuntuacion: FormatoPuntuacion;
  filasIniciales: FilaResultado[];
  categorias?: CategoriaClasificacion[];
}) {
  const [filas, setFilas] = useState<FilaResultado[]>(
    filasIniciales.length > 0 ? filasIniciales : [filaVacia()],
  );

  const guardarBorrador = guardarResultados.bind(null, torneoId, false);
  const publicarResultados = guardarResultados.bind(null, torneoId, true);

  const [estadoBorrador, dispatchBorrador, pendingBorrador] = useActionState(guardarBorrador, {
    ok: false,
    error: null,
  });
  const [estadoPublicar, dispatchPublicar, pendingPublicar] = useActionState(
    publicarResultados,
    { ok: false, error: null },
  );

  function actualizarFila(key: number, campo: keyof FilaResultado, valor: string) {
    setFilas((prev) => prev.map((f) => (f.key === key ? { ...f, [campo]: valor } : f)));
  }

  const columnaPrincipal = formatoPuntuacion === "stableford" ? "puntos" : "golpes";

  function categoriaDeFila(fila: FilaResultado): string {
    const hcp = parseFloat(fila.handicap.replace(",", "."));
    const cat = categorias.find((c) => {
      if (Number.isNaN(hcp)) return false;
      return (
        (c.handicapDesde == null || hcp >= c.handicapDesde) &&
        (c.handicapHasta == null || hcp <= c.handicapHasta)
      );
    });
    return cat?.nombre ?? "Sin categoría asignada";
  }

  // Si el torneo tiene categorías reales por hándicap, se reparten las
  // filas en una tabla por categoría (más fácil de rellenar y de leer que
  // una lista plana con todos los inscritos); si no, va todo en una tabla.
  const grupos: { nombre: string; filas: FilaResultado[] }[] =
    categorias.length === 0
      ? [{ nombre: "", filas }]
      : Object.entries(
          filas.reduce<Record<string, FilaResultado[]>>((acc, fila) => {
            const nombre = categoriaDeFila(fila);
            (acc[nombre] ??= []).push(fila);
            return acc;
          }, {}),
        )
          .map(([nombre, filasGrupo]) => ({ nombre, filas: filasGrupo }))
          .sort((a, b) => {
            const ia = categorias.findIndex((c) => c.nombre === a.nombre);
            const ib = categorias.findIndex((c) => c.nombre === b.nombre);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
          });

  return (
    <form className="card-ajag flex flex-col gap-5 p-5">
      {grupos.map((grupo) => (
        <div key={grupo.nombre || "todos"}>
          {grupo.nombre ? (
            <p className="mb-2 text-sm font-medium text-ajag-verde-900">{grupo.nombre}</p>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-ajag-gris-100 text-xs uppercase text-ajag-gris-500">
                <tr>
                  <th className="py-2 pr-2">Pos.</th>
                  <th className="py-2 pr-2">Jugador</th>
                  <th className="py-2 pr-2">Licencia</th>
                  <th className="py-2 pr-2">Hcp</th>
                  <th className="py-2 pr-2">
                    {columnaPrincipal === "puntos" ? "Puntos" : "Golpes"}
                  </th>
                  <th className="py-2 pr-2">
                    {columnaPrincipal === "puntos" ? "Golpes" : "Puntos"}
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {grupo.filas.map((fila) => (
                  <tr key={fila.key} className="border-b border-ajag-gris-100 last:border-0">
                    <td className="py-1.5 pr-2">
                      <input
                        name="posicion"
                        type="number"
                        min={1}
                        value={fila.posicion}
                        onChange={(e) => actualizarFila(fila.key, "posicion", e.target.value)}
                        className="w-16 rounded-lg border border-ajag-gris-200 px-2 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        name="nombre_mostrado"
                        value={fila.nombreMostrado}
                        onChange={(e) =>
                          actualizarFila(fila.key, "nombreMostrado", e.target.value)
                        }
                        required
                        className="w-full min-w-[10rem] rounded-lg border border-ajag-gris-200 px-2 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                      />
                      <input
                        type="hidden"
                        name="inscripcion_id"
                        value={fila.inscripcionId ?? ""}
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        name="licencia_federativa"
                        value={fila.licenciaFederativa}
                        onChange={(e) =>
                          actualizarFila(fila.key, "licenciaFederativa", e.target.value)
                        }
                        className="w-28 rounded-lg border border-ajag-gris-200 px-2 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        name="handicap"
                        type="number"
                        step="0.1"
                        value={fila.handicap}
                        onChange={(e) => actualizarFila(fila.key, "handicap", e.target.value)}
                        className="w-16 rounded-lg border border-ajag-gris-200 px-2 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                      />
                    </td>
                    {(columnaPrincipal === "puntos"
                      ? (["puntos", "golpes"] as const)
                      : (["golpes", "puntos"] as const)
                    ).map((campo) => (
                      <td key={campo} className="py-1.5 pr-2">
                        <input
                          name={campo}
                          type="number"
                          step="0.1"
                          value={fila[campo]}
                          onChange={(e) => actualizarFila(fila.key, campo, e.target.value)}
                          className="w-20 rounded-lg border border-ajag-gris-200 px-2 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                        />
                      </td>
                    ))}
                    <td className="py-1.5">
                      <button
                        type="button"
                        aria-label="Quitar fila"
                        onClick={() => setFilas((prev) => prev.filter((f) => f.key !== fila.key))}
                        className="text-ajag-gris-500 hover:text-ajag-rojo-600"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setFilas((prev) => [...prev, filaVacia()])}
        className="flex w-fit items-center gap-1 text-sm font-medium text-ajag-verde-700 hover:underline"
      >
        <Plus size={16} /> Añadir fila
      </button>

      {estadoBorrador.error ? (
        <p className="text-sm text-ajag-rojo-600">{estadoBorrador.error}</p>
      ) : null}
      {estadoPublicar.error ? (
        <p className="text-sm text-ajag-rojo-600">{estadoPublicar.error}</p>
      ) : null}
      {estadoBorrador.ok ? (
        <p className="text-sm text-ajag-verde-700">Borrador guardado.</p>
      ) : null}
      {estadoPublicar.ok ? (
        <p className="text-sm text-ajag-verde-700">Clasificación publicada.</p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          formAction={dispatchBorrador}
          disabled={pendingBorrador || pendingPublicar}
          className="rounded-xl border border-ajag-verde-700 px-5 py-2.5 text-sm font-medium text-ajag-verde-700 transition hover:bg-ajag-verde-50 disabled:opacity-60"
        >
          {pendingBorrador ? "Guardando..." : "Guardar borrador"}
        </button>
        <button
          type="submit"
          formAction={dispatchPublicar}
          disabled={pendingBorrador || pendingPublicar}
          className="rounded-xl bg-ajag-verde-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
        >
          {pendingPublicar ? "Publicando..." : "Publicar clasificación"}
        </button>
      </div>
    </form>
  );
}
