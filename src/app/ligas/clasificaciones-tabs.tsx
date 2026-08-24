"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { formatearFecha } from "@/lib/format";
import type { EstadoClasificacionTorneo } from "@/lib/data/torneos";
import type { ClasificacionPublica, LigaPool, Torneo } from "@/types/database";

type LigaConClasificacion = { liga: LigaPool; clasificacion: ClasificacionPublica[] };

const PESTANAS = ["torneos", "ligas", "ranking", "pool"] as const;
type Pestana = (typeof PESTANAS)[number];

const etiquetaPestana: Record<Pestana, string> = {
  torneos: "Torneos",
  ligas: "Ligas",
  ranking: "Ranking",
  pool: "Pool",
};

export function ClasificacionesTabs({
  torneos,
  estadoClasificacion,
  ranking,
  pool,
  ligas,
}: {
  torneos: Torneo[];
  estadoClasificacion: Record<string, EstadoClasificacionTorneo>;
  ranking: LigaConClasificacion | null;
  pool: LigaConClasificacion | null;
  ligas: LigaPool[];
}) {
  const [activa, setActiva] = useState<Pestana>("torneos");

  return (
    <div>
      <div className="mt-8 flex gap-2 border-b border-ajag-gris-100">
        {PESTANAS.map((pestana) => (
          <button
            key={pestana}
            type="button"
            onClick={() => setActiva(pestana)}
            className={`px-4 py-2.5 text-sm font-medium transition ${
              activa === pestana
                ? "border-b-2 border-ajag-verde-700 text-ajag-verde-900"
                : "text-ajag-gris-500 hover:text-ajag-verde-700"
            }`}
          >
            {etiquetaPestana[pestana]}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activa === "torneos" ? (
          <PestanaTorneos torneos={torneos} estadoClasificacion={estadoClasificacion} />
        ) : null}
        {activa === "ligas" ? <PestanaLigas ligas={ligas} /> : null}
        {activa === "ranking" ? <PestanaLiga datos={ranking} nombre="Ranking" /> : null}
        {activa === "pool" ? <PestanaLiga datos={pool} nombre="Pool" /> : null}
      </div>
    </div>
  );
}

function PestanaLigas({ ligas }: { ligas: LigaPool[] }) {
  if (ligas.length === 0) {
    return (
      <div className="card-ajag p-6 text-sm text-ajag-gris-500">
        Todavía no hay ligas creadas.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {ligas.map((liga) => (
        <Link
          key={liga.id}
          href={`/ligas/${liga.slug}`}
          className="card-ajag flex flex-col items-center gap-2 p-4 text-center transition hover:shadow-md"
        >
          <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ajag-verde-50">
            {liga.imagen_url ? (
              <Image
                src={liga.imagen_url}
                alt={liga.nombre}
                fill
                unoptimized
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <Trophy size={24} className="text-ajag-verde-700/50" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-ajag-verde-900">{liga.nombre}</p>
            {liga.tipo_oficial ? (
              <span className="mt-1 inline-block rounded-full bg-ajag-oro-500/20 px-2 py-0.5 text-xs text-ajag-oro-600">
                {liga.tipo_oficial === "ranking" ? "Ranking oficial" : "Pool oficial"}
              </span>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}

function PestanaTorneos({
  torneos,
  estadoClasificacion,
}: {
  torneos: Torneo[];
  estadoClasificacion: Record<string, EstadoClasificacionTorneo>;
}) {
  if (torneos.length === 0) {
    return (
      <div className="card-ajag p-6 text-sm text-ajag-gris-500">
        Todavía no hay torneos publicados.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {torneos.map((torneo) => {
        const disponible = estadoClasificacion[torneo.id]?.disponible ?? false;
        const contenido = (
          <>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ajag-oro-600">
                {formatearFecha(torneo.fecha)}
              </p>
              <p className="font-display font-semibold text-ajag-verde-900">{torneo.nombre}</p>
              {!disponible ? (
                <p className="mt-0.5 text-xs text-ajag-gris-500">Aún no disponible</p>
              ) : null}
            </div>
            <Trophy
              size={18}
              className={`shrink-0 ${disponible ? "text-ajag-verde-700" : "text-ajag-gris-200"}`}
            />
          </>
        );

        return disponible ? (
          <Link
            key={torneo.id}
            href={`/torneos/${torneo.slug}/clasificacion`}
            className="card-ajag flex items-center justify-between gap-3 p-4 transition hover:shadow-md"
          >
            {contenido}
          </Link>
        ) : (
          <div
            key={torneo.id}
            className="card-ajag flex items-center justify-between gap-3 p-4 opacity-60"
          >
            {contenido}
          </div>
        );
      })}
    </div>
  );
}

function PestanaLiga({ datos, nombre }: { datos: LigaConClasificacion | null; nombre: string }) {
  if (!datos) {
    return (
      <div className="card-ajag p-6 text-sm text-ajag-gris-500">
        Todavía no hay clasificación de {nombre} publicada.
      </div>
    );
  }

  const { liga, clasificacion } = datos;

  return (
    <div>
      {liga.imagen_url ? (
        <div className="relative mb-4 aspect-[21/9] w-full overflow-hidden rounded-2xl bg-ajag-verde-100">
          <Image
            src={liga.imagen_url}
            alt={liga.nombre}
            fill
            unoptimized
            className="object-cover"
            sizes="(min-width: 1024px) 900px, 100vw"
          />
        </div>
      ) : null}

      {liga.descripcion ? (
        <p className="mb-4 max-w-2xl text-sm text-ajag-gris-500">{liga.descripcion}</p>
      ) : null}

      {liga.reglas ? (
        <div className="mb-4 card-ajag p-5">
          <h3 className="mb-2 font-display text-sm font-semibold text-ajag-verde-900">Reglas</h3>
          <p className="whitespace-pre-line text-sm text-ajag-gris-500">{liga.reglas}</p>
        </div>
      ) : null}

      {clasificacion.length === 0 ? (
        <div className="card-ajag p-6 text-sm text-ajag-gris-500">
          La clasificación se publicará en cuanto haya resultados de algún torneo.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ajag-gris-100 bg-white">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-ajag-gris-100 text-xs uppercase text-ajag-gris-500">
              <tr>
                <th className="px-4 py-3">Pos.</th>
                <th className="px-4 py-3">Jugador</th>
                <th className="px-4 py-3">Eventos</th>
                <th className="px-4 py-3">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {clasificacion.map((c, i) => (
                <tr key={c.jugador_id} className="border-b border-ajag-gris-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-ajag-verde-900">{i + 1}</td>
                  <td className="px-4 py-3 text-ajag-verde-900">
                    {c.nombre} {c.apellidos}
                  </td>
                  <td className="px-4 py-3 text-ajag-gris-500">{c.eventos_jugados}</td>
                  <td className="px-4 py-3 font-medium text-ajag-verde-900">
                    {c.puntos_totales}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
