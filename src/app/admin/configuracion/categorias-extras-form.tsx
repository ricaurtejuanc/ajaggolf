"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { actualizarCategoriasExtras, type EstadoConfiguracion } from "./actions";
import type { CategoriaExtra } from "@/types/database";

// Estas tres secciones siempre existen para cualquier torneo (ceremonia,
// inscripción, avituallamiento son partes fijas del día de torneo): su
// título no se puede cambiar ni borrar, pero sus casillas sí son libres.
const SECCIONES_FIJAS = ["Ceremonia", "Inscripción", "Avituallamiento"];

function slugificar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");
}

export function CategoriasExtrasForm({ categoriasIniciales }: { categoriasIniciales: CategoriaExtra[] }) {
  const [state, formAction, pending] = useActionState<EstadoConfiguracion, FormData>(
    actualizarCategoriasExtras,
    { ok: false, error: null },
  );
  const [categorias, setCategorias] = useState<CategoriaExtra[]>(categoriasIniciales);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [nuevasOpciones, setNuevasOpciones] = useState<Record<number, string>>({});

  function agregarCategoria() {
    const nombre = nuevaCategoria.trim();
    if (!nombre) return;
    setCategorias((prev) => [...prev, { categoria: nombre, opciones: [] }]);
    setNuevaCategoria("");
  }

  function eliminarCategoria(indice: number) {
    setCategorias((prev) => prev.filter((_, i) => i !== indice));
  }

  function renombrarCategoria(indice: number, nombre: string) {
    setCategorias((prev) =>
      prev.map((cat, i) => (i === indice ? { ...cat, categoria: nombre } : cat)),
    );
  }

  function agregarOpcion(indiceCategoria: number) {
    const label = (nuevasOpciones[indiceCategoria] ?? "").trim();
    if (!label) return;

    const valoresExistentes = new Set(categorias.flatMap((c) => c.opciones.map((o) => o.value)));
    let value = slugificar(label) || "opcion";
    let sufijo = 2;
    while (valoresExistentes.has(value)) {
      value = `${slugificar(label) || "opcion"}_${sufijo}`;
      sufijo += 1;
    }

    setCategorias((prev) =>
      prev.map((cat, i) =>
        i === indiceCategoria ? { ...cat, opciones: [...cat.opciones, { value, label }] } : cat,
      ),
    );
    setNuevasOpciones((prev) => ({ ...prev, [indiceCategoria]: "" }));
  }

  function renombrarOpcion(indiceCategoria: number, indiceOpcion: number, label: string) {
    setCategorias((prev) =>
      prev.map((cat, i) =>
        i === indiceCategoria
          ? {
              ...cat,
              opciones: cat.opciones.map((o, j) => (j === indiceOpcion ? { ...o, label } : o)),
            }
          : cat,
      ),
    );
  }

  function eliminarOpcion(indiceCategoria: number, indiceOpcion: number) {
    setCategorias((prev) =>
      prev.map((cat, i) =>
        i === indiceCategoria
          ? { ...cat, opciones: cat.opciones.filter((_, j) => j !== indiceOpcion) }
          : cat,
      ),
    );
  }

  return (
    <form action={formAction} className="card-ajag flex max-w-2xl flex-col gap-5 p-5">
      <div>
        <h2 className="font-display text-base font-semibold text-ajag-verde-900">
          Torneos — Información adicional
        </h2>
        <p className="mt-1 text-xs text-ajag-gris-500">
          Define las secciones y casillas que los admins podrán marcar en
          &quot;Qué incluye&quot; al crear un torneo. Aparecerán en el mismo
          orden en la tarjeta del torneo. Ceremonia, Inscripción y
          Avituallamiento son secciones fijas (no se pueden renombrar ni
          borrar), pero puedes añadir y quitar sus casillas libremente.
        </p>
      </div>

      <input type="hidden" name="categorias" value={JSON.stringify(categorias)} />

      <div className="flex flex-col gap-4">
        {categorias.map((cat, indiceCategoria) => {
          const fija = SECCIONES_FIJAS.includes(cat.categoria);
          return (
          <div key={indiceCategoria} className="rounded-xl border border-ajag-gris-200 p-4">
            <div className="flex items-center gap-2">
              {fija ? (
                <p className="flex-1 px-3 py-1.5 text-sm font-medium text-ajag-verde-900">
                  {cat.categoria}
                </p>
              ) : (
                <input
                  value={cat.categoria}
                  onChange={(e) => renombrarCategoria(indiceCategoria, e.target.value)}
                  className="flex-1 rounded-lg border border-ajag-gris-200 px-3 py-1.5 text-sm font-medium text-ajag-verde-900 outline-none focus:border-ajag-verde-600"
                />
              )}
              {fija ? null : (
                <button
                  type="button"
                  onClick={() => eliminarCategoria(indiceCategoria)}
                  aria-label="Eliminar sección"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ajag-rojo-600 hover:bg-ajag-rojo-50"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {cat.opciones.map((opcion, indiceOpcion) => (
                <div key={opcion.value} className="flex items-center gap-2">
                  <input
                    value={opcion.label}
                    onChange={(e) =>
                      renombrarOpcion(indiceCategoria, indiceOpcion, e.target.value)
                    }
                    className="flex-1 rounded-lg border border-ajag-gris-200 px-3 py-1.5 text-sm text-ajag-verde-900 outline-none focus:border-ajag-verde-600"
                  />
                  <button
                    type="button"
                    onClick={() => eliminarOpcion(indiceCategoria, indiceOpcion)}
                    aria-label="Eliminar opción"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ajag-gris-500 hover:bg-ajag-gris-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <input
                  value={nuevasOpciones[indiceCategoria] ?? ""}
                  onChange={(e) =>
                    setNuevasOpciones((prev) => ({ ...prev, [indiceCategoria]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      agregarOpcion(indiceCategoria);
                    }
                  }}
                  placeholder="Nueva casilla..."
                  className="flex-1 rounded-lg border border-dashed border-ajag-gris-200 px-3 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                />
                <button
                  type="button"
                  onClick={() => agregarOpcion(indiceCategoria)}
                  aria-label="Añadir opción"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ajag-verde-700 hover:bg-ajag-verde-50"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={nuevaCategoria}
          onChange={(e) => setNuevaCategoria(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregarCategoria();
            }
          }}
          placeholder="Nueva sección..."
          className="flex-1 rounded-xl border border-dashed border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
        />
        <button
          type="button"
          onClick={agregarCategoria}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm font-medium text-ajag-verde-900 hover:bg-ajag-verde-50"
        >
          <Plus size={16} /> Nueva sección
        </button>
      </div>

      {state.error ? <p className="text-sm text-ajag-rojo-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-ajag-verde-700">Guardado correctamente.</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-ajag-verde-700 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar categorías"}
      </button>
    </form>
  );
}
