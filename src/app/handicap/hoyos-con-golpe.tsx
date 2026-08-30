"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { golpesEnHoyo } from "@/lib/handicap/calculo";

type Hoyo = { hoyo: number; metros: number; par: number; hcp: number };

/**
 * Tarjeta del recorrido marcando en qué hoyos recibe golpes el jugador.
 *
 * Los 10.170 hoyos del catálogo no caben en el payload de la página, así que
 * los 18 del tee elegido se piden al vuelo desde el navegador (campo_hoyos
 * es de lectura pública, así que basta la clave anónima).
 */
export function HoyosConGolpe({
  teeId,
  handicapJuego,
}: {
  teeId: string;
  handicapJuego: number;
}) {
  const [datos, setDatos] = useState<{ teeId: string; hoyos: Hoyo[] } | null>(null);

  useEffect(() => {
    if (!teeId) return;
    let cancelado = false;

    createClient()
      .from("campo_hoyos")
      .select("hoyo, metros, par, hcp")
      .eq("campo_tee_id", teeId)
      .order("hoyo")
      .then(({ data }) => {
        if (!cancelado) setDatos({ teeId, hoyos: data ?? [] });
      });

    return () => {
      cancelado = true;
    };
  }, [teeId]);

  const hoyos = datos?.teeId === teeId ? datos.hoyos : null;

  if (hoyos === null) {
    return <p className="mt-3 text-sm text-ajag-gris-500">Cargando la tarjeta…</p>;
  }
  // Los tees genéricos de campos sin valorar no traen tarjeta hoyo a hoyo.
  if (hoyos.length === 0) {
    return (
      <p className="mt-3 text-sm text-ajag-gris-500">
        Este recorrido todavía no tiene cargada su tarjeta hoyo a hoyo, así que no se puede
        decir en qué hoyos recibes golpe.
      </p>
    );
  }

  const totalMetros = hoyos.reduce((s, h) => s + h.metros, 0);

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[640px] text-center text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-ajag-gris-500">
            <th className="px-2 py-2 text-left font-medium">Hoyo</th>
            {hoyos.map((h) => (
              <th key={h.hoyo} className="px-1.5 py-2 font-medium">
                {h.hoyo}
              </th>
            ))}
            <th className="px-2 py-2 font-medium">Tot.</th>
          </tr>
        </thead>
        <tbody className="text-ajag-gris-500">
          <tr className="border-t border-ajag-gris-100">
            <td className="px-2 py-2 text-left">Metros</td>
            {hoyos.map((h) => (
              <td key={h.hoyo} className="px-1.5 py-2">
                {h.metros}
              </td>
            ))}
            <td className="px-2 py-2 font-medium text-ajag-verde-900">{totalMetros}</td>
          </tr>
          <tr className="border-t border-ajag-gris-100">
            <td className="px-2 py-2 text-left">Par</td>
            {hoyos.map((h) => (
              <td key={h.hoyo} className="px-1.5 py-2">
                {h.par}
              </td>
            ))}
            <td className="px-2 py-2 font-medium text-ajag-verde-900">
              {hoyos.reduce((s, h) => s + h.par, 0)}
            </td>
          </tr>
          <tr className="border-t border-ajag-gris-100">
            <td className="px-2 py-2 text-left">Índice</td>
            {hoyos.map((h) => (
              <td key={h.hoyo} className="px-1.5 py-2">
                {h.hcp}
              </td>
            ))}
            <td />
          </tr>
          <tr className="border-t border-ajag-gris-100 font-medium text-ajag-verde-900">
            <td className="px-2 py-2 text-left">Tus golpes</td>
            {hoyos.map((h) => {
              const golpes = golpesEnHoyo(handicapJuego, h.hcp);
              return (
                <td
                  key={h.hoyo}
                  className={`px-1.5 py-2 ${golpes > 0 ? "bg-ajag-verde-50" : ""}`}
                >
                  {golpes > 0 ? golpes : "·"}
                </td>
              );
            })}
            <td className="px-2 py-2">{handicapJuego > 0 ? handicapJuego : 0}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
