import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { listarLigasActivas } from "@/lib/data/ligas";

export const metadata: Metadata = { title: "Ligas y Pool" };

export default async function LigasPage() {
  const ligas = await listarLigasActivas();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-ajag-verde-900">
        Ligas y Pool
      </h1>
      <p className="mt-2 max-w-2xl text-ajag-gris-500">
        La clasificación de cada liga suma los puntos obtenidos por posición
        en cada torneo que la compone.
      </p>

      {ligas.length === 0 ? (
        <div className="card-ajag mt-8 p-8 text-center text-ajag-gris-500">
          No hay ligas activas por ahora.
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {ligas.map((liga) => (
            <Link key={liga.id} href={`/ligas/${liga.slug}`} className="card-ajag p-5">
              <div className="flex items-center gap-2 text-ajag-oro-600">
                <Trophy size={18} />
                {liga.temporada ? (
                  <span className="text-xs font-medium uppercase tracking-wide">
                    {liga.temporada}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-1 font-display text-lg font-semibold text-ajag-verde-900">
                {liga.nombre}
              </h2>
              {liga.descripcion ? (
                <p className="mt-1 text-sm text-ajag-gris-500">{liga.descripcion}</p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
