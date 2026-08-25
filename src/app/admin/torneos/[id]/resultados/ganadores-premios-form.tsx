"use client";

import { useActionState, useState } from "react";
import { Plus, Trophy, X } from "lucide-react";
import { actualizarGanadoresPremios, type EstadoGanadores } from "./actions";
import type { InscritoParaResultado } from "@/lib/data/resultados";
import type { PremioCategoria, PremioHoyo } from "@/types/database";

// Detecta a qué puesto se refiere el nombre de un premio ("Premio primer
// clasificado", "3er Clasificado", "4º Clasificado"...) para poder sugerir
// automáticamente al mejor candidato de esa categoría en ese puesto. Los
// premios sin puesto claro (Scratch, Mejor Dama, Drive más largo...) no
// generan ninguna coincidencia y se quedan sin sugerir, como hasta ahora.
const ORDINALES: [RegExp, number][] = [
  [/\bprimer|\b1\s*er\b|1º/i, 1],
  [/\bsegundo|\b2\s*d?o\b|2º/i, 2],
  [/\btercer|\b3\s*er\b|3º/i, 3],
  [/\bcuart|\b4\s*to\b|4º/i, 4],
  [/\bquint|\b5\s*to\b|5º/i, 5],
  [/\bsext|\b6\s*to\b|6º/i, 6],
  [/\bs[eé]ptim|\b7\s*mo\b|7º/i, 7],
  [/\boctav|\b8\s*vo\b|8º/i, 8],
  [/\bnoven|\b9\s*no\b|9º/i, 9],
  [/\bd[eé]cim|\b10\s*mo\b|10º/i, 10],
];

function detectarPosicion(nombre: string): number | null {
  for (const [regex, posicion] of ORDINALES) {
    if (regex.test(nombre)) return posicion;
  }
  const numero = nombre.match(/\b(\d{1,2})\b/);
  return numero ? parseInt(numero[1], 10) : null;
}

export function GanadoresPremiosForm({
  torneoId,
  premios,
  premiosHoyo,
  ganadoresIniciales,
  confirmados,
  sugerenciasPosicion,
}: {
  torneoId: string;
  premios: PremioCategoria[];
  premiosHoyo: PremioHoyo[];
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
  const [premiosHoyoState, setPremiosHoyoState] = useState<PremioHoyo[]>(premiosHoyo);
  const [nuevoHoyoNombre, setNuevoHoyoNombre] = useState("");
  const [nuevoHoyoNumero, setNuevoHoyoNumero] = useState("");
  const haySugerenciasPosicion = Object.keys(sugerenciasPosicion).length > 0;
  const [ganadores, setGanadores] = useState<Record<string, string[]>>(() => {
    const inicial: Record<string, string[]> = {};
    premiosHoyo.forEach((_premio, indice) => {
      const clave = `hoyo-${indice}`;
      const valores = ganadoresIniciales[clave];
      inicial[clave] = valores && valores.length > 0 ? valores : [""];
    });
    premios.forEach((cat, indiceCategoria) => {
      // Candidatos de la categoría ordenados por su puesto en la
      // clasificación general (de la tabla manual, de "Generar
      // clasificación" o del PDF/foto subido): candidatos[0] es el mejor de
      // la categoría, candidatos[1] el segundo, etc. Así se puede sugerir
      // cualquier premio con puesto (no solo el primero) sin mezclar
      // puestos de categorías distintas.
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

      cat.premios.forEach((nombrePremio, indicePremio) => {
        const clave = `${indiceCategoria}-${indicePremio}`;
        const valores = ganadoresIniciales[clave];
        if (valores && valores.length > 0) {
          inicial[clave] = valores;
          return;
        }
        // Premios sin puesto detectable en el nombre (Scratch, Drive más
        // largo, Bola más cercana...) no se sugieren, salvo el primer
        // premio de la categoría si no tiene nombre reconocible: se asume
        // que es el "1er clasificado" por convención.
        const puesto = detectarPosicion(nombrePremio) ?? (indicePremio === 0 ? 1 : null);
        const candidato = puesto != null ? candidatos[puesto - 1] : undefined;
        inicial[clave] = candidato ? [candidato.nombreCompleto] : [""];
      });
    });
    return inicial;
  });

  if (premiosState.length === 0 && premiosHoyoState.length === 0) return null;

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
  function anadirPremio(indiceCategoria: number, nombre = "") {
    setPremiosState((prev) =>
      prev.map((cat, i) =>
        i === indiceCategoria ? { ...cat, premios: [...cat.premios, nombre] } : cat,
      ),
    );
  }

  function actualizarPremioHoyo(indice: number, cambios: Partial<PremioHoyo>) {
    setPremiosHoyoState((prev) => prev.map((p, i) => (i === indice ? { ...p, ...cambios } : p)));
  }

  function anadirPremioHoyo() {
    const nombre = nuevoHoyoNombre.trim();
    if (!nombre) return;
    setPremiosHoyoState((prev) => [
      ...prev,
      { nombre, hoyo: nuevoHoyoNumero ? Number(nuevoHoyoNumero) : null },
    ]);
    // El nombre se mantiene para poder añadir rápido el mismo premio en
    // varios hoyos seguidos (ej. "Bola más cercana" en cada par 3).
    setNuevoHoyoNumero("");
  }

  // Las claves de ganadores de premios por hoyo usan el índice dentro de
  // premiosHoyoState (prefijo "hoyo-"), así que quitar uno de en medio
  // desplazaría los ganadores ya guardados de los siguientes. Solo se
  // permite quitar el último para evitar ese desajuste.
  function quitarPremioHoyo(indice: number) {
    setPremiosHoyoState((prev) => prev.filter((_, i) => i !== indice));
    const claveAEliminar = `hoyo-${indice}`;
    setGanadores((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([clave]) => clave !== claveAEliminar)),
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

      {haySugerenciasPosicion ? (
        <p className="mb-4 text-xs text-ajag-verde-700">
          Hemos propuesto ganadores según la clasificación general (PDF/foto o tabla manual).
          Revisa que sea correcto antes de guardar.
        </p>
      ) : null}

      {confirmados.length === 0 ? (
        <p className="mb-4 text-xs text-ajag-oro-600">
          Todavía no hay ningún inscrito confirmado en este torneo.
        </p>
      ) : null}

      <input type="hidden" name="ganadores" value={JSON.stringify(ganadores)} />
      <input type="hidden" name="premios" value={JSON.stringify(premiosState)} />
      <input type="hidden" name="premios_hoyo" value={JSON.stringify(premiosHoyoState)} />

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

      <div className="mt-6 border-t border-ajag-gris-100 pt-5">
        <p className="text-sm font-medium text-ajag-verde-900">Premios por hoyo</p>
        <p className="mt-1 text-xs text-ajag-gris-500">
          Drive más largo, bola más cercana... premios de un hoyo concreto, sin categoría de
          hándicap. Puedes repetir el mismo premio en varios hoyos.
        </p>

        <div className="mt-3 flex flex-col gap-3">
          {premiosHoyoState.map((premio, indice) => {
            const clave = `hoyo-${indice}`;
            const nombres = ganadores[clave] ?? [""];
            return (
              <div key={indice} className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                <div className="flex h-fit w-56 shrink-0 items-center gap-1.5">
                  <input
                    value={premio.nombre}
                    onChange={(e) => actualizarPremioHoyo(indice, { nombre: e.target.value })}
                    placeholder="Nombre del premio"
                    className="min-w-0 flex-1 rounded-lg border border-ajag-gris-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                  />
                  <input
                    type="number"
                    min={1}
                    max={18}
                    value={premio.hoyo ?? ""}
                    onChange={(e) =>
                      actualizarPremioHoyo(indice, {
                        hoyo: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="Hoyo"
                    className="w-16 shrink-0 rounded-lg border border-ajag-gris-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                  />
                  {indice === premiosHoyoState.length - 1 ? (
                    <button
                      type="button"
                      aria-label="Quitar premio"
                      onClick={() => quitarPremioHoyo(indice)}
                      className="shrink-0 text-ajag-gris-500 hover:text-ajag-rojo-600"
                    >
                      <X size={16} />
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  {nombres.map((nombre, indiceGanador) => (
                    <div key={indiceGanador} className="flex items-center gap-2">
                      <select
                        value={nombre}
                        onChange={(e) => actualizarNombre(clave, indiceGanador, e.target.value)}
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
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-ajag-gris-50 p-2">
          <input
            value={nuevoHoyoNombre}
            onChange={(e) => setNuevoHoyoNombre(e.target.value)}
            placeholder="Ej. Bola más cercana"
            className="w-44 rounded-lg border border-dashed border-ajag-gris-200 bg-white px-2 py-1 text-xs outline-none focus:border-ajag-verde-600"
          />
          <input
            value={nuevoHoyoNumero}
            onChange={(e) => setNuevoHoyoNumero(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                anadirPremioHoyo();
              }
            }}
            type="number"
            min={1}
            max={18}
            placeholder="Hoyo"
            className="w-16 rounded-lg border border-dashed border-ajag-gris-200 bg-white px-2 py-1 text-xs outline-none focus:border-ajag-verde-600"
          />
          <button
            type="button"
            onClick={anadirPremioHoyo}
            className="flex items-center gap-1 rounded-lg bg-ajag-oro-500/20 px-2 py-1 text-xs font-medium text-ajag-oro-600 hover:bg-ajag-oro-500/30"
          >
            <Plus size={12} /> Añadir premio por hoyo
          </button>
        </div>
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
