"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { formatearFechaCorta } from "@/lib/format";

export interface DetalleTorneoJugador {
  torneoSlug: string;
  torneoNombre: string;
  fecha: string;
  puntos: number;
  /** false si la liga limita a los X mejores y este resultado se queda fuera. */
  cuenta: boolean;
}

export interface FilaClasificacionLiga {
  jugadorId: string;
  nombre: string;
  puntosTotales: number;
  eventosJugados: number;
  detalle: DetalleTorneoJugador[];
}

export function ClasificacionLigaTable({
  filas,
  etiquetaPuntos = "Puntos totales",
  mejoresN = null,
}: {
  filas: FilaClasificacionLiga[];
  etiquetaPuntos?: string;
  mejoresN?: number | null;
}) {
  const [abierto, setAbierto] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-ajag-gris-100 bg-white">
      <div className="grid grid-cols-[3rem_1fr_5rem_6rem] items-center gap-2 border-b border-ajag-gris-100 px-4 py-3 text-xs uppercase text-ajag-gris-500">
        <span>Pos.</span>
        <span>Jugador</span>
        <span className="text-right">{etiquetaPuntos}</span>
        <span className="text-right">Pruebas</span>
      </div>
      {filas.map((fila, i) => {
        const estaAbierto = abierto === fila.jugadorId;
        return (
          <div key={fila.jugadorId} className="border-b border-ajag-gris-100 last:border-0">
            <button
              type="button"
              onClick={() => setAbierto(estaAbierto ? null : fila.jugadorId)}
              className="grid w-full grid-cols-[3rem_1fr_5rem_6rem] items-center gap-2 px-4 py-3 text-left text-sm transition hover:bg-ajag-verde-50/60"
            >
              <span className="font-medium text-ajag-verde-900">{i + 1}</span>
              <span className="text-ajag-verde-900">{fila.nombre}</span>
              <span className="text-right font-medium text-ajag-verde-900">
                {fila.puntosTotales}
              </span>
              <span className="flex items-center justify-end gap-1 text-ajag-gris-500">
                {fila.eventosJugados}
                <ChevronDown
                  size={15}
                  className={`shrink-0 transition-transform ${estaAbierto ? "rotate-180" : ""}`}
                />
              </span>
            </button>

            {estaAbierto ? (
              <div className="bg-ajag-verde-50/40 px-4 pb-4">
                {fila.detalle.length === 0 ? (
                  <p className="py-2 text-xs text-ajag-gris-500">
                    Todavía no hay resultados publicados de este jugador.
                  </p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase text-ajag-gris-500">
                        <th className="py-2 font-medium">Torneo</th>
                        <th className="py-2 pl-2 text-right font-medium">Puntos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fila.detalle.map((d) => (
                        <tr
                          key={d.torneoSlug}
                          className={`border-t border-ajag-gris-100/70 ${d.cuenta ? "" : "opacity-50"}`}
                        >
                          <td className="py-2 pr-2">
                            <Link
                              href={`/torneos/${d.torneoSlug}`}
                              className="text-ajag-verde-700 hover:underline"
                            >
                              {d.torneoNombre}
                            </Link>
                            <span className="ml-1.5 text-xs text-ajag-gris-500">
                              {formatearFechaCorta(d.fecha)}
                            </span>
                            {d.cuenta ? null : (
                              <span className="ml-1.5 text-xs text-ajag-gris-500">
                                (no cuenta)
                              </span>
                            )}
                          </td>
                          <td className="py-2 pl-2 text-right font-medium text-ajag-verde-900">
                            {d.puntos}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
      {mejoresN != null ? (
        <p className="border-t border-ajag-gris-100 px-4 py-3 text-xs text-ajag-gris-500">
          Se cogen los mejores {mejoresN} resultados de toda la liga.
        </p>
      ) : null}
    </div>
  );
}
