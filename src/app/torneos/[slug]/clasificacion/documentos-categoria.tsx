"use client";

import { useState } from "react";
import { PdfPreview } from "@/components/torneos/pdf-preview";
import type { CategoriaClasificacionPdf } from "@/types/database";

export type DocumentoCategoria = {
  categoria: CategoriaClasificacionPdf;
  etiqueta: string;
  url: string;
  esPdf: boolean;
};

/**
 * Clasificación publicada como PDF/foto, con un documento por categoría.
 * Cuando solo hay uno (el caso de siempre: "Categoría única") no se enseña
 * ningún selector, para no añadir ruido donde no hay nada que elegir.
 */
export function DocumentosCategoria({
  documentos,
  nombreTorneo,
}: {
  documentos: DocumentoCategoria[];
  nombreTorneo: string;
}) {
  const [activa, setActiva] = useState<CategoriaClasificacionPdf>(documentos[0].categoria);
  const documento = documentos.find((d) => d.categoria === activa) ?? documentos[0];
  const alt = `Clasificación ${documento.etiqueta} de ${nombreTorneo}`;

  return (
    <div>
      {documentos.length > 1 ? (
        <div className="mb-4">
          <label
            htmlFor="categoria-clasificacion"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-ajag-gris-500"
          >
            Categoría
          </label>
          <select
            id="categoria-clasificacion"
            value={activa}
            onChange={(e) => setActiva(e.target.value as CategoriaClasificacionPdf)}
            className="w-full rounded-xl border border-ajag-gris-200 bg-white px-3 py-2.5 text-sm font-medium text-ajag-verde-900 sm:w-auto"
          >
            {documentos.map((d) => (
              <option key={d.categoria} value={d.categoria}>
                {d.etiqueta}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {documento.esPdf ? (
        <PdfPreview key={documento.url} url={documento.url} alt={alt} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={documento.url}
          alt={alt}
          className="w-full rounded-2xl border border-ajag-gris-100"
        />
      )}
      <a
        href={documento.url}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block text-sm font-medium text-ajag-verde-700 hover:underline"
      >
        Abrir en una pestaña nueva ↗
      </a>
    </div>
  );
}
