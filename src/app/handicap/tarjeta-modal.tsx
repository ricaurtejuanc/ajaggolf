"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Hoyo = { hoyo: number; metros: number; par: number; hcp: number };
type Filtro = "todos" | "ida" | "vuelta";

/**
 * Tarjeta completa del recorrido (Hoyo / Distancia / Par / Hcp), sin marcar
 * golpes de nadie — solo lo que trae la tarjeta física del campo. Distinta
 * de HoyosConGolpe (que sí calcula golpes de un jugador concreto): esta se
 * puede abrir nada más elegir la barra, sin haber rellenado el HI todavía.
 */
export function TarjetaModal({
  titulo,
  teeId,
  onClose,
}: {
  titulo: string;
  teeId: string;
  onClose: () => void;
}) {
  const [hoyos, setHoyos] = useState<Hoyo[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");

  useEffect(() => {
    let cancelado = false;
    createClient()
      .from("campo_hoyos")
      .select("hoyo, metros, par, hcp")
      .eq("campo_tee_id", teeId)
      .order("hoyo")
      .then(({ data }) => {
        if (!cancelado) setHoyos(data ?? []);
      });
    return () => {
      cancelado = true;
    };
  }, [teeId]);

  const filas = (hoyos ?? []).filter((h) =>
    filtro === "ida" ? h.hoyo <= 9 : filtro === "vuelta" ? h.hoyo >= 10 : true,
  );
  const total = filas.reduce(
    (acc, h) => ({ metros: acc.metros + h.metros, par: acc.par + h.par }),
    { metros: 0, par: 0 },
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16 sm:items-center sm:pt-4"
      onClick={onClose}
    >
      <div
        className="card-ajag w-full max-w-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-base font-semibold text-ajag-verde-900">{titulo}</h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-sm font-medium text-ajag-verde-700 hover:underline"
            aria-label="Cerrar"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          {(["todos", "ida", "vuelta"] as const).map((valor) => (
            <button
              key={valor}
              type="button"
              onClick={() => setFiltro(valor)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filtro === valor
                  ? "bg-ajag-verde-700 text-white"
                  : "border border-ajag-gris-200 text-ajag-verde-900 hover:bg-ajag-verde-50"
              }`}
            >
              {valor === "todos" ? "Todos" : valor === "ida" ? "Ida (1-9)" : "Vuelta (10-18)"}
            </button>
          ))}
        </div>

        {hoyos === null ? (
          <p className="mt-4 text-sm text-ajag-gris-500">Cargando la tarjeta…</p>
        ) : hoyos.length === 0 ? (
          <p className="mt-4 text-sm text-ajag-gris-500">
            Este recorrido todavía no tiene cargada su tarjeta hoyo a hoyo.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ajag-gris-100 text-xs uppercase tracking-wide text-ajag-gris-500">
                  <th className="py-2 pr-4 font-medium">Hoyo</th>
                  <th className="py-2 pr-4 font-medium">Distancia</th>
                  <th className="py-2 pr-4 font-medium">Par</th>
                  <th className="py-2 font-medium">HCP</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((h) => (
                  <tr key={h.hoyo} className="border-b border-ajag-gris-100 last:border-0">
                    <td className="py-2 pr-4 text-ajag-verde-900">{h.hoyo}</td>
                    <td className="py-2 pr-4 text-ajag-gris-500">{h.metros} m</td>
                    <td className="py-2 pr-4 text-ajag-gris-500">{h.par}</td>
                    <td className="py-2 text-ajag-gris-500">{h.hcp}</td>
                  </tr>
                ))}
                <tr className="font-medium text-ajag-verde-900">
                  <td className="py-2 pr-4">Total</td>
                  <td className="py-2 pr-4">{total.metros} m</td>
                  <td className="py-2 pr-4">{total.par}</td>
                  <td className="py-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
