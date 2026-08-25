"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { PremioHoyo } from "@/types/database";

export function PremiosHoyoEditor({ premiosIniciales }: { premiosIniciales: PremioHoyo[] }) {
  const [premios, setPremios] = useState<PremioHoyo[]>(premiosIniciales);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoHoyo, setNuevoHoyo] = useState("");

  function agregar() {
    const nombre = nuevoNombre.trim();
    if (!nombre) return;
    setPremios((prev) => [...prev, { nombre, hoyo: nuevoHoyo ? Number(nuevoHoyo) : null }]);
    // El nombre se mantiene para poder añadir rápido el mismo premio en
    // varios hoyos seguidos (ej. "Bola más cercana" en cada par 3).
    setNuevoHoyo("");
  }

  function eliminar(indice: number) {
    setPremios((prev) => prev.filter((_, i) => i !== indice));
  }

  function actualizar(indice: number, cambios: Partial<PremioHoyo>) {
    setPremios((prev) => prev.map((p, i) => (i === indice ? { ...p, ...cambios } : p)));
  }

  return (
    <div>
      <span className="text-sm font-medium text-ajag-verde-900">Premios por hoyo</span>
      <p className="mt-1 text-xs text-ajag-gris-500">
        Drive más largo, bola más cercana... premios que no dependen de la clasificación ni de
        una categoría de hándicap, sino de un hoyo concreto. Puedes repetir el mismo premio en
        varios hoyos (por ejemplo, bola más cercana en cada par 3).
      </p>

      <input type="hidden" name="premios_hoyo" value={JSON.stringify(premios)} />

      {premios.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          {premios.map((premio, indice) => (
            <div key={indice} className="flex items-center gap-2">
              <input
                value={premio.nombre}
                onChange={(e) => actualizar(indice, { nombre: e.target.value })}
                className="flex-1 rounded-lg border border-ajag-gris-200 px-3 py-1.5 text-sm text-ajag-verde-900 outline-none focus:border-ajag-verde-600"
              />
              <input
                type="number"
                min={1}
                max={18}
                placeholder="Hoyo"
                value={premio.hoyo ?? ""}
                onChange={(e) =>
                  actualizar(indice, { hoyo: e.target.value ? Number(e.target.value) : null })
                }
                className="w-20 rounded-lg border border-ajag-gris-200 px-2 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
              />
              <button
                type="button"
                onClick={() => eliminar(indice)}
                aria-label="Eliminar premio"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ajag-gris-500 hover:bg-ajag-gris-100"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-2">
        <input
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          placeholder="Ej. Bola más cercana"
          className="flex-1 rounded-lg border border-dashed border-ajag-gris-200 px-3 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
        />
        <input
          type="number"
          min={1}
          max={18}
          value={nuevoHoyo}
          onChange={(e) => setNuevoHoyo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregar();
            }
          }}
          placeholder="Hoyo"
          className="w-20 rounded-lg border border-dashed border-ajag-gris-200 px-2 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
        />
        <button
          type="button"
          onClick={agregar}
          aria-label="Añadir premio por hoyo"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ajag-verde-700 hover:bg-ajag-verde-50"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
