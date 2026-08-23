"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

export function TeesInput({
  name,
  label,
  placeholder,
  valoresIniciales,
}: {
  name: string;
  label: string;
  placeholder: string;
  valoresIniciales: string[];
}) {
  const [valores, setValores] = useState<string[]>(
    valoresIniciales.length > 0 ? valoresIniciales : [""],
  );

  return (
    <div>
      <span className="block text-sm font-medium text-ajag-verde-900">{label}</span>
      <div className="mt-1 flex flex-col gap-2">
        {valores.map((valor, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              name={name}
              placeholder={placeholder}
              value={valor}
              onChange={(e) =>
                setValores((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
              }
              className="w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
            />
            {valores.length > 1 ? (
              <button
                type="button"
                aria-label="Quitar"
                onClick={() => setValores((prev) => prev.filter((_, idx) => idx !== i))}
                className="shrink-0 text-ajag-gris-500 hover:text-ajag-rojo-600"
              >
                <X size={18} />
              </button>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setValores((prev) => [...prev, ""])}
          className="flex w-fit items-center gap-1 text-sm font-medium text-ajag-verde-700 hover:underline"
        >
          <Plus size={16} /> Añadir tee
        </button>
      </div>
    </div>
  );
}
