"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { formatearFecha } from "@/lib/format";
import type { EstadoClasificacionTorneo } from "@/lib/data/torneos";
import type { LigaPool, Torneo } from "@/types/database";

const PESTANAS = ["torneos", "ligas"] as const;
type Pestana = (typeof PESTANAS)[number];

const etiquetaPestana: Record<Pestana, string> = {
  torneos: "Torneos",
  ligas: "Ligas",
};

export function ClasificacionesTabs({
  torneos,
  estadoClasificacion,
  ligas,
}: {
  torneos: Torneo[];
  estadoClasificacion: Record<string, EstadoClasificacionTorneo>;
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
          href={`/clasificaciones/${liga.slug}`}
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

  const activos = torneos.filter((t) => t.estado === "publicado");
  const disputados = torneos.filter((t) => t.estado !== "publicado");

  return (
    <div className="flex flex-col gap-8">
      {activos.length > 0 ? (
        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-ajag-gris-500">
            Activos
          </h3>
          <ListaTorneos torneos={activos} estadoClasificacion={estadoClasificacion} />
        </div>
      ) : null}
      {disputados.length > 0 ? (
        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-ajag-gris-500">
            Disputados
          </h3>
          <ListaTorneos torneos={disputados} estadoClasificacion={estadoClasificacion} />
        </div>
      ) : null}
    </div>
  );
}

function ListaTorneos({
  torneos,
  estadoClasificacion,
}: {
  torneos: Torneo[];
  estadoClasificacion: Record<string, EstadoClasificacionTorneo>;
}) {
  return (
    <div className="flex flex-col gap-3">
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

