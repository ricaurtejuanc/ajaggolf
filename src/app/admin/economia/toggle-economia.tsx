"use client";

import { useTransition } from "react";
import { alternarEconomia } from "./actions";

/** Interruptor de "llevar la economía del club" para el organizador actual. */
export function ToggleEconomia({ activa }: { activa: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="card-ajag flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="min-w-0">
        <p className="font-display text-base font-semibold text-ajag-verde-900">
          Llevar la economía del club
        </p>
        <p className="mt-0.5 text-sm text-ajag-gris-500">
          {activa
            ? "Activada: la sección Economía aparece en el menú y en cada torneo."
            : "Desactivada: no se ofrece en el menú ni en los torneos. Lo ya registrado se conserva y vuelve a verse al reactivarla."}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={activa}
        aria-label="Llevar la economía del club"
        disabled={pending}
        onClick={() => startTransition(() => alternarEconomia(!activa))}
        className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${
          activa ? "bg-ajag-verde-700" : "bg-ajag-gris-200"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
            activa ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
