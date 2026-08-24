"use client";

import { useActionState } from "react";
import { Trophy } from "lucide-react";
import { actualizarGanadoresPremios, type EstadoGanadores } from "./actions";
import type { PremioCategoria } from "@/types/database";

export function GanadoresPremiosForm({
  torneoId,
  premios,
  ganadoresIniciales,
}: {
  torneoId: string;
  premios: PremioCategoria[];
  ganadoresIniciales: Record<string, string>;
}) {
  const accion = actualizarGanadoresPremios.bind(null, torneoId);
  const [state, formAction, pending] = useActionState<EstadoGanadores, FormData>(accion, {
    ok: false,
    error: null,
  });

  if (premios.length === 0) return null;

  return (
    <form action={formAction} className="card-ajag mb-6 p-5">
      <h2 className="mb-1 flex items-center gap-2 font-display text-base font-semibold text-ajag-verde-900">
        <Trophy size={17} className="text-ajag-oro-600" /> Ganadores de los premios
      </h2>
      <p className="mb-4 text-xs text-ajag-gris-500">
        Escribe el nombre del ganador de cada premio (drive más largo, par 3 más cercano...).
        Se mostrará públicamente en la ficha del torneo.
      </p>

      <div className="flex flex-col gap-4">
        {premios.map((cat, indiceCategoria) => (
          <div key={indiceCategoria}>
            <p className="text-sm font-medium text-ajag-verde-900">{cat.nombre}</p>
            <div className="mt-2 flex flex-col gap-2">
              {cat.premios.map((premio, indicePremio) => {
                const clave = `${indiceCategoria}-${indicePremio}`;
                return (
                  <div key={clave} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <label htmlFor={`ganador_${clave}`} className="w-56 shrink-0 text-sm text-ajag-gris-500">
                      {premio}
                    </label>
                    <input
                      id={`ganador_${clave}`}
                      name={`ganador_${clave}`}
                      placeholder="Nombre del ganador"
                      defaultValue={ganadoresIniciales[clave] ?? ""}
                      className="w-full rounded-lg border border-ajag-gris-200 px-3 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {state.error ? <p className="mt-3 text-sm text-ajag-rojo-600">{state.error}</p> : null}
      {state.ok ? <p className="mt-3 text-sm text-ajag-verde-700">Guardado correctamente.</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-xl bg-ajag-verde-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar ganadores"}
      </button>
    </form>
  );
}
