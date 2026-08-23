"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

interface Fila {
  key: number;
  posicion: string;
  puntos: string;
}

let contador = 0;
function nuevaFila(posicion = "", puntos = ""): Fila {
  return { key: contador++, posicion, puntos };
}

export function TablaPuntosEditor({
  tablaInicial,
}: {
  tablaInicial: Record<string, number>;
}) {
  const [filas, setFilas] = useState<Fila[]>(() => {
    const entradas = Object.entries(tablaInicial);
    if (entradas.length === 0) {
      return [1, 2, 3, 4, 5].map((n) => nuevaFila(String(n), String(30 - n * 2)));
    }
    return entradas.map(([pos, pts]) => nuevaFila(pos, String(pts)));
  });

  return (
    <div>
      <span className="text-sm font-medium text-ajag-verde-900">
        Puntos por posición *
      </span>
      <p className="mt-1 text-xs text-ajag-gris-500">
        Añade tantas posiciones como quieras puntuar. Usa &quot;resto&quot; como
        posición para dar puntos a partir de ahí a todos los que no tengan fila
        propia.
      </p>

      <div className="mt-2 flex flex-col gap-2">
        {filas.map((fila) => (
          <div key={fila.key} className="flex items-center gap-2">
            <input
              name="posicion"
              placeholder="Posición (ej. 1, resto)"
              defaultValue={fila.posicion}
              required
              className="w-40 rounded-xl border border-ajag-gris-200 px-3 py-2 text-sm outline-none focus:border-ajag-verde-600"
            />
            <input
              name="puntos"
              type="number"
              placeholder="Puntos"
              defaultValue={fila.puntos}
              required
              className="w-28 rounded-xl border border-ajag-gris-200 px-3 py-2 text-sm outline-none focus:border-ajag-verde-600"
            />
            <button
              type="button"
              aria-label="Quitar posición"
              onClick={() => setFilas((prev) => prev.filter((f) => f.key !== fila.key))}
              className="text-ajag-gris-500 hover:text-ajag-rojo-600"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setFilas((prev) => [...prev, nuevaFila()])}
        className="mt-2 flex items-center gap-1 text-sm font-medium text-ajag-verde-700 hover:underline"
      >
        <Plus size={16} /> Añadir posición
      </button>
    </div>
  );
}
