"use client";

import { useTransition } from "react";
import { eliminarRonda } from "@/app/handicap/actions";
import { formatearFechaCorta } from "@/lib/format";
import type { Ronda } from "@/types/database";

function BotonEliminar({ rondaId }: { rondaId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("¿Eliminar esta ronda del historial?")) {
          startTransition(() => eliminarRonda(rondaId));
        }
      }}
      className="text-sm font-medium text-ajag-rojo-600 hover:underline disabled:opacity-50"
    >
      Eliminar
    </button>
  );
}

export function RondasList({ rondas }: { rondas: Ronda[] }) {
  return (
    <div className="flex flex-col gap-3">
      {rondas.map((r) => (
        <div key={r.id} className="card-ajag p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-ajag-oro-600">
                {formatearFechaCorta(r.fecha)}
              </p>
              <h3 className="font-display text-base font-semibold text-ajag-verde-900">
                {r.campo}
              </h3>
              <p className="mt-0.5 text-sm text-ajag-gris-500">
                {[r.recorrido, r.tee].filter(Boolean).join(" · ") || "—"}
                {" · "}CR {r.course_rating} / Slope {r.slope_rating} / Par {r.par}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-2xl font-semibold text-ajag-verde-900">
                {Number(r.differential).toFixed(1)}
              </p>
              <p className="text-xs text-ajag-gris-500">Differential</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-ajag-gris-100 pt-3 text-sm text-ajag-gris-500">
            <span>
              Bruto <span className="font-medium text-ajag-verde-900">{r.bruto}</span>
            </span>
            <span>
              Neto <span className="font-medium text-ajag-verde-900">{r.neto}</span>
            </span>
            <span>
              Stableford{" "}
              <span className="font-medium text-ajag-verde-900">{r.puntos_stableford}</span>
            </span>
            <span>
              Hcp de juego{" "}
              <span className="font-medium text-ajag-verde-900">{r.handicap_juego}</span>
            </span>
            <div className="ml-auto">
              <BotonEliminar rondaId={r.id} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
