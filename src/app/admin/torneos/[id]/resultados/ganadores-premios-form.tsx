"use client";

import { useActionState, useState } from "react";
import { Plus, Trophy, X } from "lucide-react";
import { actualizarGanadoresPremios, type EstadoGanadores } from "./actions";
import type { InscritoParaResultado } from "@/lib/data/resultados";
import type { PremioCategoria } from "@/types/database";

export function GanadoresPremiosForm({
  torneoId,
  premios,
  ganadoresIniciales,
  confirmados,
  sugerenciasPosicion,
}: {
  torneoId: string;
  premios: PremioCategoria[];
  ganadoresIniciales: Record<string, string[]>;
  confirmados: InscritoParaResultado[];
  sugerenciasPosicion: Record<string, number>;
}) {
  const accion = actualizarGanadoresPremios.bind(null, torneoId);
  const [state, formAction, pending] = useActionState<EstadoGanadores, FormData>(accion, {
    ok: false,
    error: null,
  });
  const [premiosState, setPremiosState] = useState<PremioCategoria[]>(premios);
  const haySugerenciasPdf = Object.keys(sugerenciasPosicion).length > 0;
  const [ganadores, setGanadores] = useState<Record<string, string[]>>(() => {
    const inicial: Record<string, string[]> = {};
    premios.forEach((cat, indiceCategoria) => {
      // Mejor candidato de la categoría según la clasificación del PDF/foto
      // subido: solo se usa para sugerir el primer premio (normalmente "1er
      // clasificado"); el resto de premios (2º, drive más largo...) no se
      // pueden inferir de forma fiable de una clasificación general.
      const candidatos = confirmados
        .filter((c) => {
          if (cat.categoria_unica) return true;
          if (cat.handicap_desde == null || cat.handicap_hasta == null) return true;
          return (
            c.handicap != null && c.handicap >= cat.handicap_desde && c.handicap <= cat.handicap_hasta
          );
        })
        .filter((c) => sugerenciasPosicion[c.inscripcionId] != null)
        .sort((a, b) => sugerenciasPosicion[a.inscripcionId] - sugerenciasPosicion[b.inscripcionId]);

      cat.premios.forEach((_, indicePremio) => {
        const clave = `${indiceCategoria}-${indicePremio}`;
        const valores = ganadoresIniciales[clave];
        if (valores && valores.length > 0) {
          inicial[clave] = valores;
        } else if (indicePremio === 0 && candidatos[0]) {
          inicial[clave] = [candidatos[0].nombreCompleto];
        } else {
          inicial[clave] = [""];
        }
      });
    });
    return inicial;
  });

  if (premiosState.length === 0) return null;

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

  function actualizarNombrePremio(indiceCategoria: number, indicePremio: number, valor: string) {
    setPremiosState((prev) =>
      prev.map((cat, i) =>
        i === indiceCategoria
          ? { ...cat, premios: cat.premios.map((p, j) => (j === indicePremio ? valor : p)) }
          : cat,
      ),
    );
  }

  // Los premios nuevos siempre se añaden al final de la categoría: las claves
  // de ganadores usan el índice del premio, así que insertar o reordenar en
  // medio rompería la asignación de ganadores ya guardados.
  function anadirPremio(indiceCategoria: number) {
    setPremiosState((prev) =>
      prev.map((cat, i) =>
        i === indiceCategoria ? { ...cat, premios: [...cat.premios, ""] } : cat,
      ),
    );
  }

  return (
    <form action={formAction} className="card-ajag mb-6 p-5">
      <h2 className="mb-1 flex items-center gap-2 font-display text-base font-semibold text-ajag-verde-900">
        <Trophy size={17} className="text-ajag-oro-600" /> Cuadro de honor
      </h2>
      <p className="mb-4 text-xs text-ajag-gris-500">
        Elige el ganador de cada premio entre los inscritos confirmados. En premios como
        Drive más largo o Par 3 más cercano puedes añadir varios ganadores (uno por hoyo).
        Si falta algún premio (por ejemplo, tercer clasificado) puedes añadirlo aquí mismo.
        Se mostrará públicamente en la ficha del torneo y en la clasificación.
      </p>

      {haySugerenciasPdf ? (
        <p className="mb-4 text-xs text-ajag-verde-700">
          Hemos propuesto el primer clasificado de cada categoría a partir del PDF/foto
          subido. Revisa que sea correcto antes de guardar.
        </p>
      ) : null}

      {confirmados.length === 0 ? (
        <p className="mb-4 text-xs text-ajag-oro-600">
          Todavía no hay ningún inscrito confirmado en este torneo.
        </p>
      ) : null}

      <input type="hidden" name="ganadores" value={JSON.stringify(ganadores)} />
      <input type="hidden" name="premios" value={JSON.stringify(premiosState)} />

      <div className="flex flex-col gap-5">
        {premiosState.map((cat, indiceCategoria) => (
          <div key={indiceCategoria}>
            <p className="text-sm font-medium text-ajag-verde-900">{cat.nombre}</p>
            <div className="mt-2 flex flex-col gap-3">
              {cat.premios.map((premio, indicePremio) => {
                const clave = `${indiceCategoria}-${indicePremio}`;
                const nombres = ganadores[clave] ?? [""];
                return (
                  <div key={clave} className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                    <input
                      value={premio}
                      onChange={(e) =>
                        actualizarNombrePremio(indiceCategoria, indicePremio, e.target.value)
                      }
                      placeholder="Nombre del premio"
                      className="h-fit w-56 shrink-0 rounded-lg border border-ajag-gris-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                    />
                    <div className="flex flex-1 flex-col gap-1.5">
                      {nombres.map((nombre, indiceGanador) => (
                        <div key={indiceGanador} className="flex items-center gap-2">
                          <select
                            value={nombre}
                            onChange={(e) =>
                              actualizarNombre(clave, indiceGanador, e.target.value)
                            }
                            className="w-full rounded-lg border border-ajag-gris-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                          >
                            <option value="">Selecciona un inscrito</option>
                            {confirmados.map((c) => (
                              <option key={c.inscripcionId} value={c.nombreCompleto}>
                                {c.nombreCompleto}
                              </option>
                            ))}
                            {nombre && !confirmados.some((c) => c.nombreCompleto === nombre) ? (
                              <option value={nombre}>{nombre} (no está en la lista)</option>
                            ) : null}
                          </select>
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
              <button
                type="button"
                onClick={() => anadirPremio(indiceCategoria)}
                className="flex w-fit items-center gap-1 text-xs font-medium text-ajag-oro-600 hover:underline"
              >
                <Plus size={13} /> Añadir premio en {cat.nombre}
              </button>
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
