"use client";

import { useState } from "react";
import { ScrollText } from "lucide-react";

/**
 * Botón + ventana emergente con las normas del torneo. Es un componente de
 * cliente autocontenido (botón y modal juntos, con su propio useState) en
 * vez de recibir un onClose desde un Server Component: un Server Component
 * no puede pasarle una función a un Client Component (ver /cuenta).
 */
export function NormasModal({ normas }: { normas: string | null }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <div className="mt-6 card-ajag p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold text-ajag-verde-900">
            Normas del torneo
          </h2>
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-ajag-verde-700 px-4 py-2 text-sm font-medium text-ajag-verde-700 transition hover:bg-ajag-verde-50"
          >
            <ScrollText size={16} />
            Ver normas
          </button>
        </div>
      </div>

      {abierto ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16 sm:items-center sm:pt-4"
          onClick={() => setAbierto(false)}
        >
          <div
            className="card-ajag w-full max-w-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-base font-semibold text-ajag-verde-900">
                Normas del torneo
              </h2>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="shrink-0 text-sm font-medium text-ajag-verde-700 hover:underline"
                aria-label="Cerrar"
              >
                Cerrar
              </button>
            </div>
            <p className="mt-4 max-h-[65vh] overflow-y-auto whitespace-pre-line text-sm text-ajag-gris-500">
              {normas || "Este torneo no tiene normas específicas."}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
