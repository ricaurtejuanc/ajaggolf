"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { PremioCategoria } from "@/types/database";

export function PremiosEditor({ premiosIniciales }: { premiosIniciales: PremioCategoria[] }) {
  const [categorias, setCategorias] = useState<PremioCategoria[]>(premiosIniciales);
  const [nuevosPremios, setNuevosPremios] = useState<Record<number, string>>({});

  function agregarCategoria() {
    setCategorias((prev) => [
      ...prev,
      { nombre: `Categoría ${prev.length + 1}`, handicap_desde: null, handicap_hasta: null, premios: [] },
    ]);
  }

  function eliminarCategoria(indice: number) {
    setCategorias((prev) => prev.filter((_, i) => i !== indice));
  }

  function actualizarCategoria(indice: number, cambios: Partial<PremioCategoria>) {
    setCategorias((prev) => prev.map((cat, i) => (i === indice ? { ...cat, ...cambios } : cat)));
  }

  function agregarPremio(indiceCategoria: number) {
    const texto = (nuevosPremios[indiceCategoria] ?? "").trim();
    if (!texto) return;
    setCategorias((prev) =>
      prev.map((cat, i) =>
        i === indiceCategoria ? { ...cat, premios: [...cat.premios, texto] } : cat,
      ),
    );
    setNuevosPremios((prev) => ({ ...prev, [indiceCategoria]: "" }));
  }

  function renombrarPremio(indiceCategoria: number, indicePremio: number, texto: string) {
    setCategorias((prev) =>
      prev.map((cat, i) =>
        i === indiceCategoria
          ? { ...cat, premios: cat.premios.map((p, j) => (j === indicePremio ? texto : p)) }
          : cat,
      ),
    );
  }

  function eliminarPremio(indiceCategoria: number, indicePremio: number) {
    setCategorias((prev) =>
      prev.map((cat, i) =>
        i === indiceCategoria
          ? { ...cat, premios: cat.premios.filter((_, j) => j !== indicePremio) }
          : cat,
      ),
    );
  }

  return (
    <div>
      <span className="text-sm font-medium text-ajag-verde-900">Premios</span>
      <p className="mt-1 text-xs text-ajag-gris-500">
        Crea una categoría por cada tramo de hándicap (o solo una para categoría única), y
        añade dentro los premios que quieras. Usa una categoría sin hándicap para premios
        aparte como Scratch, Mejor Dama o Mejor Senior.
      </p>

      <input type="hidden" name="premios" value={JSON.stringify(categorias)} />

      <div className="mt-3 flex flex-col gap-4">
        {categorias.map((cat, indiceCategoria) => (
          <div key={indiceCategoria} className="rounded-xl border border-ajag-gris-200 p-4">
            <div className="flex items-center gap-2">
              <input
                value={cat.nombre}
                onChange={(e) => actualizarCategoria(indiceCategoria, { nombre: e.target.value })}
                className="flex-1 rounded-lg border border-ajag-gris-200 px-3 py-1.5 text-sm font-medium text-ajag-verde-900 outline-none focus:border-ajag-verde-600"
              />
              <button
                type="button"
                onClick={() => eliminarCategoria(indiceCategoria)}
                aria-label="Eliminar categoría"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ajag-rojo-600 hover:bg-ajag-rojo-50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-ajag-gris-500">
              <span>Hándicap</span>
              <input
                type="number"
                step="0.1"
                placeholder="desde"
                value={cat.handicap_desde ?? ""}
                onChange={(e) =>
                  actualizarCategoria(indiceCategoria, {
                    handicap_desde: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="w-24 rounded-lg border border-ajag-gris-200 px-2 py-1 text-sm outline-none focus:border-ajag-verde-600"
              />
              <span>—</span>
              <input
                type="number"
                step="0.1"
                placeholder="hasta"
                value={cat.handicap_hasta ?? ""}
                onChange={(e) =>
                  actualizarCategoria(indiceCategoria, {
                    handicap_hasta: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="w-24 rounded-lg border border-ajag-gris-200 px-2 py-1 text-sm outline-none focus:border-ajag-verde-600"
              />
              <span>(opcional)</span>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {cat.premios.map((premio, indicePremio) => (
                <div key={indicePremio} className="flex items-center gap-2">
                  <input
                    value={premio}
                    onChange={(e) => renombrarPremio(indiceCategoria, indicePremio, e.target.value)}
                    className="flex-1 rounded-lg border border-ajag-gris-200 px-3 py-1.5 text-sm text-ajag-verde-900 outline-none focus:border-ajag-verde-600"
                  />
                  <button
                    type="button"
                    onClick={() => eliminarPremio(indiceCategoria, indicePremio)}
                    aria-label="Eliminar premio"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ajag-gris-500 hover:bg-ajag-gris-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <input
                  value={nuevosPremios[indiceCategoria] ?? ""}
                  onChange={(e) =>
                    setNuevosPremios((prev) => ({ ...prev, [indiceCategoria]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      agregarPremio(indiceCategoria);
                    }
                  }}
                  placeholder="Ej. Premio primer clasificado"
                  className="flex-1 rounded-lg border border-dashed border-ajag-gris-200 px-3 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                />
                <button
                  type="button"
                  onClick={() => agregarPremio(indiceCategoria)}
                  aria-label="Añadir premio"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ajag-verde-700 hover:bg-ajag-verde-50"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={agregarCategoria}
        className="mt-3 flex items-center gap-1.5 rounded-xl border border-dashed border-ajag-gris-200 px-4 py-2.5 text-sm font-medium text-ajag-verde-900 hover:bg-ajag-verde-50"
      >
        <Plus size={16} /> Añadir categoría
      </button>
    </div>
  );
}
