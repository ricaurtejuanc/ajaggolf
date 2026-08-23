"use client";

import { useActionState, useState } from "react";
import { generarSalidas, type EstadoGenerarSalidas } from "./actions";
import type { ModoAsignacionSalida, ModoSalida, Salida } from "@/types/database";

const TODOS_LOS_HOYOS = Array.from({ length: 18 }, (_, i) => i + 1);

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

  const teesConsecutivoIniciales = Array.isArray(configExistente.tees)
    ? new Set((configExistente.tees as number[]).map(Number))
    : new Set([1]);
  const [teesConsecutivo, setTeesConsecutivo] = useState<Set<number>>(teesConsecutivoIniciales);

  const hoyosSalidaIniciales = Array.isArray(configExistente.hoyos_salida)
    ? new Set((configExistente.hoyos_salida as number[]).map(Number))
    : new Set([1]);
  const [hoyosSalida, setHoyosSalida] = useState<Set<number>>(hoyosSalidaIniciales);

  const hoyosDobladosIniciales = Array.isArray(configExistente.hoyos_doblados)
    ? new Set((configExistente.hoyos_doblados as number[]).map(Number))
    : new Set<number>();
  const [hoyosDoblados, setHoyosDoblados] = useState<Set<number>>(hoyosDobladosIniciales);

  function alternar(set: Set<number>, valor: number): Set<number> {
    const copia = new Set(set);
    if (copia.has(valor)) copia.delete(valor);
    else copia.add(valor);
    return copia;
  }

  function alternarHoyoSalida(hoyo: number) {
    setHoyosSalida((prev) => alternar(prev, hoyo));
    // Si se quita un hoyo de "salida", deja de tener sentido marcarlo doblado.
    setHoyosDoblados((prev) => (prev.has(hoyo) && hoyosSalida.has(hoyo) ? alternar(prev, hoyo) : prev));
  }

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
              Consecutivo
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
          <label htmlFor="modo_asignacion" className="block text-sm font-medium text-ajag-verde-900">
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
            <label htmlFor="hora_inicio" className="block text-sm font-medium text-ajag-verde-900">
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
            <label
              htmlFor="intervalo_minutos"
              className="block text-sm font-medium text-ajag-verde-900"
            >
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
          <div className="sm:col-span-2">
            <span className="text-sm font-medium text-ajag-verde-900">Tee de salida</span>
            <div className="mt-1 flex gap-4">
              {[1, 10].map((tee) => (
                <label key={tee} className="flex items-center gap-2 text-sm text-ajag-gris-500">
                  <input
                    type="checkbox"
                    name="tee_consecutivo"
                    value={tee}
                    checked={teesConsecutivo.has(tee)}
                    onChange={() => setTeesConsecutivo((prev) => alternar(prev, tee))}
                  />
                  Tee {tee}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-ajag-gris-500">
              Si marcas los dos, los grupos se reparten por turnos entre ambos tees.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-sm font-medium text-ajag-verde-900">Hoyos de salida</span>
            <div className="mt-1.5 grid grid-cols-6 gap-1.5 sm:grid-cols-9">
              {TODOS_LOS_HOYOS.map((hoyo) => (
                <label
                  key={hoyo}
                  className="flex items-center justify-center gap-1 rounded-lg border border-ajag-gris-200 py-1.5 text-sm text-ajag-gris-500 has-[:checked]:border-ajag-verde-600 has-[:checked]:bg-ajag-verde-50 has-[:checked]:text-ajag-verde-900"
                >
                  <input
                    type="checkbox"
                    name="hoyos_salida"
                    value={hoyo}
                    checked={hoyosSalida.has(hoyo)}
                    onChange={() => alternarHoyoSalida(hoyo)}
                    className="sr-only"
                  />
                  {hoyo}
                </label>
              ))}
            </div>
          </div>

          {hoyosSalida.size > 0 ? (
            <div>
              <span className="text-sm font-medium text-ajag-verde-900">Hoyos doblados</span>
              <p className="mt-0.5 text-xs text-ajag-gris-500">
                Marca los hoyos, de entre los de salida, donde salgan dos grupos a la vez.
              </p>
              <div className="mt-1.5 grid grid-cols-6 gap-1.5 sm:grid-cols-9">
                {TODOS_LOS_HOYOS.filter((hoyo) => hoyosSalida.has(hoyo)).map((hoyo) => (
                  <label
                    key={hoyo}
                    className="flex items-center justify-center gap-1 rounded-lg border border-ajag-gris-200 py-1.5 text-sm text-ajag-gris-500 has-[:checked]:border-ajag-oro-500 has-[:checked]:bg-ajag-oro-500/10 has-[:checked]:text-ajag-oro-600"
                  >
                    <input
                      type="checkbox"
                      name="hoyos_doblados"
                      value={hoyo}
                      checked={hoyosDoblados.has(hoyo)}
                      onChange={() => setHoyosDoblados((prev) => alternar(prev, hoyo))}
                      className="sr-only"
                    />
                    {hoyo}
                  </label>
                ))}
              </div>
            </div>
          ) : null}
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
