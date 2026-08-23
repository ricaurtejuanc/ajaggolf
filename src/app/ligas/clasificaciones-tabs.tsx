"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { formatearFecha } from "@/lib/format";
import type { ClasificacionPublica, LigaPool, Torneo } from "@/types/database";

type LigaConClasificacion = { liga: LigaPool; clasificacion: ClasificacionPublica[] };

const PESTANAS = ["torneos", "ranking", "pool"] as const;
type Pestana = (typeof PESTANAS)[number];

const etiquetaPestana: Record<Pestana, string> = {
  torneos: "Torneos",
  ranking: "Ranking",
  pool: "Pool",
};

export function ClasificacionesTabs({
  torneos,
  ranking,
  pool,
}: {
  torneos: Torneo[];
  ranking: LigaConClasificacion | null;
  pool: LigaConClasificacion | null;
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
        {activa === "torneos" ? <PestanaTorneos torneos={torneos} /> : null}
        {activa === "ranking" ? <PestanaLiga datos={ranking} nombre="Ranking" /> : null}
        {activa === "pool" ? <PestanaLiga datos={pool} nombre="Pool" /> : null}
      </div>
    </div>
  );
}

function PestanaTorneos({ torneos }: { torneos: Torneo[] }) {
  if (torneos.length === 0) {
    return (
      <div className="card-ajag p-6 text-sm text-ajag-gris-500">
        Todavía no hay clasificaciones de torneos publicadas.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {torneos.map((torneo) => (
        <Link
          key={torneo.id}
          href={`/torneos/${torneo.slug}/clasificacion`}
          className="card-ajag flex items-center justify-between gap-3 p-4 transition hover:shadow-md"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ajag-oro-600">
              {formatearFecha(torneo.fecha)}
            </p>
            <p className="font-display font-semibold text-ajag-verde-900">{torneo.nombre}</p>
          </div>
          <Trophy size={18} className="shrink-0 text-ajag-verde-700" />
        </Link>
      ))}
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
