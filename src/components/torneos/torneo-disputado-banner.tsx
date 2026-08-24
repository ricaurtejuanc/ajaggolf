import Link from "next/link";
import { Trophy } from "lucide-react";
import { formatearFecha } from "@/lib/format";
import type { Torneo } from "@/types/database";

const claseActiva =
  "rounded-full bg-ajag-verde-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-ajag-verde-600";
const claseInactiva =
  "rounded-full bg-ajag-gris-100 px-4 py-2 text-sm font-medium text-ajag-gris-500";

export function TorneoDisputadoBanner({
  torneo,
  horariosDisponible,
  horariosHref,
  clasificacionDisponible,
}: {
  torneo: Torneo;
  horariosDisponible: boolean;
  horariosHref: string | null;
  clasificacionDisponible: boolean;
}) {
  const ganadores = torneo.premios.flatMap((cat, indiceCategoria) =>
    cat.premios
      .map((premio, indicePremio) => ({
        premio,
        nombres: torneo.premios_ganadores[`${indiceCategoria}-${indicePremio}`] ?? [],
      }))
      .filter((g) => g.nombres.length > 0),
  );

  return (
    <div className="card-ajag flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ajag-oro-600">
          {formatearFecha(torneo.fecha)}
        </p>
        <Link
          href={`/torneos/${torneo.slug}`}
          className="font-display text-lg font-semibold text-ajag-verde-900 hover:underline"
        >
          {torneo.nombre}
        </Link>

        {ganadores.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-0.5">
            {ganadores.map((g) => (
              <li key={g.premio} className="flex items-center gap-1.5 text-sm text-ajag-gris-500">
                <Trophy size={13} className="shrink-0 text-ajag-oro-600" />
                {g.premio}:{" "}
                <span className="font-medium text-ajag-verde-900">{g.nombres.join(", ")}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link href={`/torneos/${torneo.slug}`} className={claseActiva}>
          Ver cartel
        </Link>

        {horariosDisponible && horariosHref ? (
          horariosHref.startsWith("/") ? (
            <Link href={horariosHref} className={claseActiva}>
              Horarios
            </Link>
          ) : (
            <a href={horariosHref} target="_blank" rel="noreferrer" className={claseActiva}>
              Horarios
            </a>
          )
        ) : (
          <span className={claseInactiva}>Horarios</span>
        )}

        {clasificacionDisponible ? (
          <Link href={`/torneos/${torneo.slug}/clasificacion`} className={claseActiva}>
            Clasificaciones
          </Link>
        ) : (
          <span className={claseInactiva}>Clasificaciones</span>
        )}
      </div>
    </div>
  );
}
