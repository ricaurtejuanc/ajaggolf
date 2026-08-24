"use client";

import { useState } from "react";
import type { ReactNode } from "react";

const claseBotonActivo =
  "rounded-full bg-ajag-verde-700 px-3 py-1.5 text-xs font-medium text-white transition";
const claseBotonInactivo =
  "rounded-full border border-ajag-gris-200 px-3 py-1.5 text-xs font-medium text-ajag-gris-500 transition hover:border-ajag-verde-600 hover:text-ajag-verde-900";

export function ClasificacionGeneralToggle({
  hayDocumento,
  documentoUploader,
  tablaManual,
}: {
  hayDocumento: boolean;
  documentoUploader: ReactNode;
  tablaManual: ReactNode;
}) {
  const [modo, setModo] = useState<"pdf" | "manual" | null>(hayDocumento ? "pdf" : null);

  return (
    <div className="mb-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-base font-semibold text-ajag-verde-900">
          Clasificación general
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setModo("pdf")}
            className={modo === "pdf" ? claseBotonActivo : claseBotonInactivo}
          >
            Subo PDF/foto
          </button>
          <button
            type="button"
            onClick={() => setModo("manual")}
            className={modo === "manual" ? claseBotonActivo : claseBotonInactivo}
          >
            La relleno a mano
          </button>
        </div>
      </div>

      {modo === null ? (
        <div className="card-ajag p-5 text-sm text-ajag-gris-500">
          Elige cómo vas a publicar la clasificación general con todos los jugadores: subiendo un
          PDF o foto, o rellenando la tabla a mano por categorías.
        </div>
      ) : modo === "pdf" ? (
        documentoUploader
      ) : (
        tablaManual
      )}
    </div>
  );
}
