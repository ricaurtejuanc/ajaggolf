"use client";

import { useActionState, useState } from "react";
import { generarSalidas, type EstadoGenerarSalidas } from "./actions";
import type { ModoAsignacionSalida, ModoSalida, Salida } from "@/types/database";

export function GenerarSalidasForm({
  torneoId,
  modoSalidaDefecto,
  modoAsignacionDefecto,
  salidaExistente,
  nJugadoresConfirmados,
}: {
  torneoId: string;
  modoSalidaDefecto: ModoSalida;
  modoAsignacionDefecto: ModoAsignacionSalida;
  salidaExistente: Salida | null;
  nJugadoresConfirmados: number;
}) {
  const accion = generarSalidas.bind(null, torneoId);
  const [state, formAction, pending] = useActionState<EstadoGenerarSalidas, FormData>(accion, {
    ok: false,
    error: null,
  });

  const [modo, setModo] = useState<ModoSalida>(salidaExistente?.modo ?? modoSalidaDefecto);

  const configExistente = (salidaExistente?.config ?? {}) as Record<string, unknown>;

  return (
    <form action={formAction} className="card-ajag flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ajag-verde-900">
          {salidaExistente ? "Volver a generar el cuadro" : "Generar cuadro de salidas"}
        </h2>
        <span className="text-xs text-ajag-gris-500">
          {nJugadoresConfirmados} jugadores confirmados
        </span>
      </div>

      {salidaExistente ? (
        <p className="text-xs text-ajag-oro-600">
          Ya existe un cuadro para este torneo. Generar de nuevo lo sustituye por completo (y lo
          deja en borrador si estaba publicado).
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="text-sm font-medium text-ajag-verde-900">Modo de salida</span>
          <div className="mt-1 flex gap-4">
            <label className="flex items-center gap-2 text-sm text-ajag-gris-500">
              <input
                type="radio"
                name="modo"
                value="consecutivo"
                checked={modo === "consecutivo"}
                onChange={() => setModo("consecutivo")}
              />
              Consecutivo (tee 1)
            </label>
            <label className="flex items-center gap-2 text-sm text-ajag-gris-500">
              <input
                type="radio"
                name="modo"
                value="shotgun"
                checked={modo === "shotgun"}
                onChange={() => setModo("shotgun")}
              />
              A tiro (shotgun)
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="modo_asignacion" className="text-sm font-medium text-ajag-verde-900">
            Criterio de agrupación
          </label>
          <select
            id="modo_asignacion"
            name="modo_asignacion"
            defaultValue={salidaExistente?.modo_asignacion ?? modoAsignacionDefecto}
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          >
            <option value="handicap">Automático por hándicap</option>
            <option value="manual">Personalizado (lo armo yo)</option>
            <option value="mixto">Mezcla de niveles</option>
          </select>
        </div>
      </div>

      {modo === "consecutivo" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="hora_inicio" className="text-sm font-medium text-ajag-verde-900">
              Hora de la primera salida
            </label>
            <input
              id="hora_inicio"
              name="hora_inicio"
              type="time"
              defaultValue={(configExistente.hora_inicio as string) ?? "08:00"}
              className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
            />
          </div>
          <div>
            <label htmlFor="intervalo_minutos" className="text-sm font-medium text-ajag-verde-900">
              Intervalo entre grupos (min)
            </label>
            <input
              id="intervalo_minutos"
              name="intervalo_minutos"
              type="number"
              min={1}
              defaultValue={(configExistente.intervalo_minutos as number) ?? 10}
              className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="hoyos_salida" className="text-sm font-medium text-ajag-verde-900">
              Hoyos de salida
            </label>
            <input
              id="hoyos_salida"
              name="hoyos_salida"
              placeholder="1, 10"
              defaultValue={
                Array.isArray(configExistente.hoyos_salida)
                  ? (configExistente.hoyos_salida as number[]).join(", ")
                  : "1, 10"
              }
              className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
            />
            <p className="mt-1 text-xs text-ajag-gris-500">Separados por coma.</p>
          </div>
          <div>
            <label htmlFor="hoyos_doblados" className="text-sm font-medium text-ajag-verde-900">
              Hoyos doblados
            </label>
            <input
              id="hoyos_doblados"
              name="hoyos_doblados"
              placeholder="Opcional"
              defaultValue={
                Array.isArray(configExistente.hoyos_doblados)
                  ? (configExistente.hoyos_doblados as number[]).join(", ")
                  : ""
              }
              className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
            />
            <p className="mt-1 text-xs text-ajag-gris-500">
              Hoyos donde salen dos grupos a la vez.
            </p>
          </div>
        </div>
      )}

      {state.error ? <p className="text-sm text-ajag-rojo-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending || nJugadoresConfirmados === 0}
        className="self-start rounded-xl bg-ajag-verde-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
      >
        {pending ? "Generando..." : salidaExistente ? "Volver a generar" : "Generar cuadro"}
      </button>
    </form>
  );
}
