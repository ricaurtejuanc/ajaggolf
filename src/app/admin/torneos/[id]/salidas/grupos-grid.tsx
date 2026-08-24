"use client";

import { useTransition } from "react";
import { AlertTriangle, Wand2 } from "lucide-react";
import { moverJugador, autocompletarPorHandicap } from "./actions";

export interface JugadorEnGrupoVista {
  inscripcionId: string;
  nombre: string;
  handicap: number | null;
  sexo: string | null;
  juegaConLicencias: string[];
  conflictoJuegaCon: boolean;
  conflictoDetalle: string | null;
}

export interface GrupoVista {
  id: string;
  numeroGrupo: number;
  hoyoSalida: number;
  horaSalida: string | null;
}

export function GruposGrid({
  torneoId,
  grupos,
  jugadoresPorGrupo,
  sinAsignar,
}: {
  torneoId: string;
  grupos: GrupoVista[];
  jugadoresPorGrupo: Record<string, JugadorEnGrupoVista[]>;
  sinAsignar: JugadorEnGrupoVista[];
}) {
  const [pending, startTransition] = useTransition();

  const conflictos = grupos
    .flatMap((g) => jugadoresPorGrupo[g.id] ?? [])
    .filter((j) => j.conflictoJuegaCon);

  function mover(inscripcionId: string, valor: string) {
    startTransition(() =>
      moverJugador(torneoId, inscripcionId, valor === "" ? null : valor),
    );
  }

  function autocompletar() {
    startTransition(() => autocompletarPorHandicap(torneoId));
  }

  return (
    <div className="flex flex-col gap-5">
      {conflictos.length > 0 ? (
        <div className="card-ajag border-ajag-oro-500 bg-ajag-oro-500/10 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ajag-oro-600">
            <AlertTriangle size={16} /> {conflictos.length} conflicto
            {conflictos.length > 1 ? "s" : ""} de &quot;jugar con&quot; sin resolver
          </p>
          <ul className="space-y-1 text-sm text-ajag-verde-900">
            {conflictos.map((c) => (
              <li key={c.inscripcionId}>{c.conflictoDetalle}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {grupos.map((grupo) => (
          <div key={grupo.id} className="card-ajag p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-ajag-verde-900">
                Grupo {grupo.numeroGrupo}
              </span>
              <span className="text-xs text-ajag-gris-500">
                {grupo.horaSalida
                  ? `Hora ${grupo.horaSalida.slice(0, 5)} · Hoyo ${grupo.hoyoSalida}`
                  : `Hoyo ${grupo.hoyoSalida}`}
              </span>
            </div>

            <ul className="flex flex-col gap-2">
              {(jugadoresPorGrupo[grupo.id] ?? []).map((j) => (
                <li
                  key={j.inscripcionId}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    j.conflictoJuegaCon
                      ? "border-ajag-oro-500 bg-ajag-oro-500/10"
                      : "border-ajag-gris-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-ajag-verde-900">{j.nombre}</span>
                    {j.conflictoJuegaCon ? (
                      <AlertTriangle size={14} className="shrink-0 text-ajag-oro-600" />
                    ) : null}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="text-xs text-ajag-gris-500">
                      Hcp {j.handicap ?? "—"}
                    </span>
                    <select
                      disabled={pending}
                      value={grupo.id}
                      onChange={(e) => mover(j.inscripcionId, e.target.value)}
                      className="rounded-lg border border-ajag-gris-200 bg-white px-2 py-1 text-xs outline-none"
                    >
                      {grupos.map((g) => (
                        <option key={g.id} value={g.id}>
                          Grupo {g.numeroGrupo}
                        </option>
                      ))}
                      <option value="">Sin asignar</option>
                    </select>
                  </div>
                </li>
              ))}
              {(jugadoresPorGrupo[grupo.id] ?? []).length === 0 ? (
                <li className="rounded-lg border border-dashed border-ajag-gris-200 px-3 py-2 text-xs text-ajag-gris-500">
                  Sin jugadores todavía
                </li>
              ) : null}
            </ul>
          </div>
        ))}
      </div>

      {sinAsignar.length > 0 ? (
        <div className="card-ajag p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-sm font-semibold text-ajag-verde-900">
              Sin asignar ({sinAsignar.length})
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={autocompletar}
              className="flex items-center gap-1.5 rounded-full bg-ajag-verde-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
            >
              <Wand2 size={13} />
              {pending ? "Repartiendo..." : "Autocompletar por hándicap"}
            </button>
          </div>
          <p className="mb-3 text-xs text-ajag-gris-500">
            Coloca antes a mano los grupos ya organizados (con el selector de cada jugador) y
            luego usa este botón: rellena los huecos que queden con el resto de jugadores
            ordenados por hándicap.
          </p>
          <ul className="flex flex-col gap-2">
            {sinAsignar.map((j) => (
              <li
                key={j.inscripcionId}
                className="flex items-center justify-between gap-2 rounded-lg border border-ajag-gris-100 px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium text-ajag-verde-900">{j.nombre}</span>
                  <span className="ml-2 text-xs text-ajag-gris-500">
                    Hcp {j.handicap ?? "—"}
                    {j.juegaConLicencias.length > 0
                      ? ` · quiere jugar con: ${j.juegaConLicencias.join(", ")}`
                      : ""}
                  </span>
                </div>
                <select
                  disabled={pending}
                  defaultValue=""
                  onChange={(e) => mover(j.inscripcionId, e.target.value)}
                  className="rounded-lg border border-ajag-gris-200 bg-white px-2 py-1 text-xs outline-none"
                >
                  <option value="" disabled>
                    Asignar a...
                  </option>
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>
                      Grupo {g.numeroGrupo}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
