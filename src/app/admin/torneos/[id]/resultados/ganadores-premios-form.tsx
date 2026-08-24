"use client";

import { useActionState, useState } from "react";
import { Plus, Trophy, X } from "lucide-react";
import { actualizarGanadoresPremios, type EstadoGanadores } from "./actions";
import type { PremioCategoria } from "@/types/database";

export function GanadoresPremiosForm({
  torneoId,
  premios,
  ganadoresIniciales,
}: {
  torneoId: string;
  premios: PremioCategoria[];
  ganadoresIniciales: Record<string, string[]>;
}) {
  const accion = actualizarGanadoresPremios.bind(null, torneoId);
  const [state, formAction, pending] = useActionState<EstadoGanadores, FormData>(accion, {
    ok: false,
    error: null,
  });
  const [ganadores, setGanadores] = useState<Record<string, string[]>>(() => {
    const inicial: Record<string, string[]> = {};
    premios.forEach((cat, indiceCategoria) => {
      cat.premios.forEach((_, indicePremio) => {
        const clave = `${indiceCategoria}-${indicePremio}`;
        const valores = ganadoresIniciales[clave];
        inicial[clave] = valores && valores.length > 0 ? valores : [""];
      });
    });
    return inicial;
  });

  if (premios.length === 0) return null;

  function actualizarNombre(clave: string, indice: number, valor: string) {
    setGanadores((prev) => ({
      ...prev,
      [clave]: (prev[clave] ?? [""]).map((v, i) => (i === indice ? valor : v)),
    }));
  }

  function anadirGanador(clave: string) {
    setGanadores((prev) => ({ ...prev, [clave]: [...(prev[clave] ?? [""]), ""] }));
  }

  function quitarGanador(clave: string, indice: number) {
    setGanadores((prev) => ({
      ...prev,
      [clave]: (prev[clave] ?? [""]).filter((_, i) => i !== indice),
    }));
  }

  return (
    <form action={formAction} className="card-ajag mb-6 p-5">
      <h2 className="mb-1 flex items-center gap-2 font-display text-base font-semibold text-ajag-verde-900">
        <Trophy size={17} className="text-ajag-oro-600" /> Cuadro de honor
      </h2>
      <p className="mb-4 text-xs text-ajag-gris-500">
        Escribe el nombre del ganador de cada premio. En premios como Drive más largo o
        Par 3 más cercano puedes añadir varios ganadores (uno por hoyo). Se mostrará
        públicamente en la ficha del torneo y en la clasificación.
      </p>

      <input type="hidden" name="ganadores" value={JSON.stringify(ganadores)} />

      <div className="flex flex-col gap-5">
        {premios.map((cat, indiceCategoria) => (
          <div key={indiceCategoria}>
            <p className="text-sm font-medium text-ajag-verde-900">{cat.nombre}</p>
            <div className="mt-2 flex flex-col gap-3">
              {cat.premios.map((premio, indicePremio) => {
                const clave = `${indiceCategoria}-${indicePremio}`;
                const nombres = ganadores[clave] ?? [""];
                return (
                  <div key={clave} className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                    <span className="w-56 shrink-0 pt-1.5 text-sm text-ajag-gris-500">
                      {premio}
                    </span>
                    <div className="flex flex-1 flex-col gap-1.5">
                      {nombres.map((nombre, indiceGanador) => (
                        <div key={indiceGanador} className="flex items-center gap-2">
                          <input
                            placeholder="Nombre del ganador"
                            value={nombre}
                            onChange={(e) =>
                              actualizarNombre(clave, indiceGanador, e.target.value)
                            }
                            className="w-full rounded-lg border border-ajag-gris-200 px-3 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                          />
                          {nombres.length > 1 ? (
                            <button
                              type="button"
                              aria-label="Quitar ganador"
                              onClick={() => quitarGanador(clave, indiceGanador)}
                              className="shrink-0 text-ajag-gris-500 hover:text-ajag-rojo-600"
                            >
                              <X size={16} />
                            </button>
                          ) : null}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => anadirGanador(clave)}
                        className="flex w-fit items-center gap-1 text-xs font-medium text-ajag-verde-700 hover:underline"
                      >
                        <Plus size={13} /> Añadir otro ganador
                      </button>
                    </div>
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
        {pending ? "Guardando..." : "Guardar cuadro de honor"}
      </button>
    </form>
  );
}
