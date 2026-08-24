"use client";

import { useActionState, useState } from "react";
import { ListOrdered } from "lucide-react";
import { guardarPosicionesLiga, type EstadoPosicionesLiga } from "./actions";
import type { InscritoParaResultado } from "@/lib/data/resultados";

export function PosicionesLigaForm({
  torneoId,
  ligaPoolId,
  posiciones,
  tablaPuntos,
  confirmados,
  posicionesIniciales,
}: {
  torneoId: string;
  ligaPoolId: string;
  posiciones: number[];
  tablaPuntos: Record<string, number>;
  confirmados: InscritoParaResultado[];
  posicionesIniciales: Record<string, string>;
}) {
  const accion = guardarPosicionesLiga.bind(null, torneoId, ligaPoolId);
  const [state, formAction, pending] = useActionState<EstadoPosicionesLiga, FormData>(accion, {
    ok: false,
    error: null,
  });
  const [seleccion, setSeleccion] = useState<Record<string, string>>(posicionesIniciales);

  function actualizar(posicion: number, inscripcionId: string) {
    setSeleccion((prev) => ({ ...prev, [String(posicion)]: inscripcionId }));
  }

  return (
    <form action={formAction} className="card-ajag mb-6 p-5">
      <h2 className="mb-1 flex items-center gap-2 font-display text-base font-semibold text-ajag-verde-900">
        <ListOrdered size={17} className="text-ajag-oro-600" /> Puestos que puntúan para la liga
      </h2>
      <p className="mb-4 text-xs text-ajag-gris-500">
        Este torneo puntúa para una liga/pool. Elige quién quedó en cada puesto, hasta donde
        reparte puntos la tabla de la liga, y se generará automáticamente la clasificación de
        este torneo y se sumará a la clasificación general de la liga. Si luego quieres afinar
        golpes o añadir más jugadores, puedes hacerlo abajo en la tabla de resultados.
      </p>

      {confirmados.length === 0 ? (
        <p className="mb-4 text-xs text-ajag-oro-600">
          Todavía no hay ningún inscrito confirmado en este torneo.
        </p>
      ) : null}

      <input type="hidden" name="posiciones" value={JSON.stringify(seleccion)} />

      <div className="flex flex-col gap-2">
        {posiciones.map((posicion) => (
          <div key={posicion} className="flex items-center gap-3">
            <span className="w-36 shrink-0 text-sm text-ajag-gris-500">
              {posicion}º puesto{" "}
              <span className="text-ajag-oro-600">
                ({tablaPuntos[String(posicion)] ?? 0} pts)
              </span>
            </span>
            <select
              value={seleccion[String(posicion)] ?? ""}
              onChange={(e) => actualizar(posicion, e.target.value)}
              className="w-full max-w-sm rounded-lg border border-ajag-gris-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
            >
              <option value="">Sin asignar</option>
              {confirmados.map((c) => (
                <option key={c.inscripcionId} value={c.inscripcionId}>
                  {c.nombreCompleto}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {state.error ? <p className="mt-3 text-sm text-ajag-rojo-600">{state.error}</p> : null}
      {state.ok ? (
        <p className="mt-3 text-sm text-ajag-verde-700">
          Clasificación generada y sumada a la liga.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-xl bg-ajag-verde-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Generar clasificación desde estos puestos"}
      </button>
    </form>
  );
}
