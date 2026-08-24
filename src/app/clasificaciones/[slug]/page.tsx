import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { obtenerLigaPorSlug } from "@/lib/data/ligas";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  const { data: clasificacion } = await supabase
    .from("clasificacion_publica")
    .select("*")
    .eq("liga_pool_id", liga.id)
    .order("puntos_totales", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {liga.imagen_url ? (
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl bg-ajag-verde-100">
          <Image
            src={liga.imagen_url}
            alt={liga.nombre}
            fill
            unoptimized
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
      ) : null}

      <p className="mt-6 text-xs font-medium uppercase tracking-wide text-ajag-oro-600">
        {liga.temporada ?? "Liga AJAG"}
      </p>
      <h1 className="font-display text-3xl font-semibold text-ajag-verde-900">
        {liga.nombre}
      </h1>
      {liga.descripcion ? (
        <p className="mt-2 max-w-2xl text-ajag-gris-500">{liga.descripcion}</p>
      ) : null}

      {liga.reglas ? (
        <div className="mt-6 card-ajag p-5">
          <h2 className="mb-2 font-display text-base font-semibold text-ajag-verde-900">
            Reglas
          </h2>
          <p className="whitespace-pre-line text-sm text-ajag-gris-500">{liga.reglas}</p>
        </div>
      ) : null}

      <h2 className="mt-8 mb-4 flex items-center gap-2 font-display text-xl font-semibold text-ajag-verde-900">
        <Trophy size={20} className="text-ajag-oro-600" /> Clasificación oficial
      </h2>

      {!clasificacion || clasificacion.length === 0 ? (
        <div className="card-ajag p-6 text-sm text-ajag-gris-500">
          La clasificación se publicará en cuanto haya resultados de algún
          torneo de esta liga.
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
