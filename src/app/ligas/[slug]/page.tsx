import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obtenerLigaPorSlug } from "@/lib/data/ligas";
import { TorneoCard } from "@/components/torneos/torneo-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resultado = await obtenerLigaPorSlug(slug);
  return { title: resultado?.liga.nombre ?? "Liga" };
}

export default async function LigaDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resultado = await obtenerLigaPorSlug(slug);
  if (!resultado) notFound();
  const { liga, torneos } = resultado;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs font-medium uppercase tracking-wide text-ajag-oro-600">
        {liga.temporada ?? "Liga AJAG"}
      </p>
      <h1 className="font-display text-3xl font-semibold text-ajag-verde-900">
        {liga.nombre}
      </h1>
      {liga.descripcion ? (
        <p className="mt-2 max-w-2xl text-ajag-gris-500">{liga.descripcion}</p>
      ) : null}

      <div className="mt-8 card-ajag p-6 text-sm text-ajag-gris-500">
        La clasificación global de esta liga se publicará aquí en cuanto se
        confirmen los resultados de sus torneos.
      </div>

      <h2 className="mt-10 mb-4 font-display text-xl font-semibold text-ajag-verde-900">
        Torneos que puntúan
      </h2>
      {torneos.length === 0 ? (
        <p className="text-ajag-gris-500">Todavía no hay torneos asignados a esta liga.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {torneos.map((torneo) => (
            <TorneoCard key={torneo.id} torneo={torneo} />
          ))}
        </div>
      )}
    </div>
  );
}
