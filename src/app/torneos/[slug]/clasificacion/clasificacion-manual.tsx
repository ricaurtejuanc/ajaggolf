"use client";

import { useState } from "react";
import type { CategoriaClasificacionPdf, Resultado } from "@/types/database";

export type GrupoClasificacionManual = {
  categoria: CategoriaClasificacionPdf;
  etiqueta: string;
  resultados: Resultado[];
};

/**
 * Clasificación general rellenada a mano en el admin, con un selector de
 * categoría cuando el torneo publica más de una — igual que al subir un
 * PDF/foto por categoría (`DocumentosCategoria`). Con una sola categoría
 * ("única" en la mayoría de torneos) no se muestra selector, para no añadir
 * ruido donde no hay nada que elegir.
 */
export function ClasificacionManual({
  grupos,
  columnaPrincipal,
}: {
  grupos: GrupoClasificacionManual[];
  columnaPrincipal: "puntos" | "golpes";
}) {
  const [activa, setActiva] = useState<CategoriaClasificacionPdf>(grupos[0].categoria);
  const grupo = grupos.find((g) => g.categoria === activa) ?? grupos[0];

  return (
    <div>
      {grupos.length > 1 ? (
        <div className="mb-4">
          <label
            htmlFor="categoria-clasificacion-manual"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-ajag-gris-500"
          >
            Categoría
          </label>
          <select
            id="categoria-clasificacion-manual"
            value={activa}
            onChange={(e) => setActiva(e.target.value as CategoriaClasificacionPdf)}
            className="w-full rounded-xl border border-ajag-gris-200 bg-white px-3 py-2.5 text-sm font-medium text-ajag-verde-900 sm:w-auto"
          >
            {grupos.map((g) => (
              <option key={g.categoria} value={g.categoria}>
                {g.etiqueta}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-ajag-gris-100 bg-white">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-ajag-gris-100 text-[0.65rem] uppercase text-ajag-gris-500 sm:text-xs">
            <tr>
              <th className="px-2 py-2 sm:px-4 sm:py-3">Pos.</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3">Jugador</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3">Hcp</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3">
                {columnaPrincipal === "puntos" ? "Puntos" : "Golpes"}
              </th>
            </tr>
          </thead>
          <tbody>
            {grupo.resultados.map((r) => (
              <tr key={r.id} className="border-b border-ajag-gris-100 last:border-0">
                <td className="px-2 py-2 font-medium text-ajag-verde-900 sm:px-4 sm:py-3">
                  {r.posicion ?? "—"}
                </td>
                <td className="px-2 py-2 text-ajag-verde-900 sm:px-4 sm:py-3">
                  {r.nombre_mostrado}
                </td>
                <td className="px-2 py-2 text-ajag-gris-500 sm:px-4 sm:py-3">
                  {r.handicap ?? "—"}
                </td>
                <td className="px-2 py-2 text-ajag-gris-500 sm:px-4 sm:py-3">
                  {r.estado_juego === "retirado"
                    ? "Retirado"
                    : r.estado_juego === "no_presentado"
                      ? "No presentado"
                      : ((columnaPrincipal === "puntos" ? r.puntos : r.golpes) ?? "—")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
