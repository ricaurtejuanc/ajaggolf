import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { obtenerTorneoPorSlug } from "@/lib/data/torneos";
import { CuadroDeHonor } from "@/components/torneos/cuadro-de-honor";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const torneo = await obtenerTorneoPorSlug(slug);
  return { title: torneo ? `Clasificación — ${torneo.nombre}` : "Clasificación" };
}

export default async function ClasificacionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const torneo = await obtenerTorneoPorSlug(slug);
  if (!torneo) notFound();

  const supabase = await createClient();

  if (torneo.liga_pool_id) {
    const { data: resultados } = await supabase
      .from("resultados")
      .select("*")
      .eq("torneo_id", torneo.id)
      .eq("estado", "publicado")
      .order("posicion", { ascending: true, nullsFirst: false });

    if (!resultados || resultados.length === 0) notFound();

    const columnaPrincipal = torneo.formato_puntuacion === "stableford" ? "puntos" : "golpes";

    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href={`/torneos/${slug}`} className="text-sm text-ajag-gris-500 hover:underline">
          ← {torneo.nombre}
        </Link>
        <h1 className="mt-2 flex items-center gap-2 font-display text-2xl font-semibold text-ajag-verde-900">
          <Trophy size={22} className="text-ajag-oro-600" /> Clasificación
        </h1>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-ajag-gris-100 bg-white">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-ajag-gris-100 text-xs uppercase text-ajag-gris-500">
              <tr>
                <th className="px-4 py-3">Pos.</th>
                <th className="px-4 py-3">Jugador</th>
                <th className="px-4 py-3">Hcp</th>
                <th className="px-4 py-3">
                  {columnaPrincipal === "puntos" ? "Puntos" : "Golpes"}
                </th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r) => (
                <tr key={r.id} className="border-b border-ajag-gris-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-ajag-verde-900">
                    {r.posicion ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-ajag-verde-900">{r.nombre_mostrado}</td>
                  <td className="px-4 py-3 text-ajag-gris-500">{r.handicap ?? "—"}</td>
                  <td className="px-4 py-3 text-ajag-gris-500">
                    {(columnaPrincipal === "puntos" ? r.puntos : r.golpes) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <CuadroDeHonor torneo={torneo} />
        </div>
      </div>
    );
  }

  const { data: documento } = await supabase
    .from("resultados_pdf_uploads")
    .select("storage_path, nombre_archivo")
    .eq("torneo_id", torneo.id)
    .eq("estado", "publicado")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!documento) notFound();

  const { data } = supabase.storage.from("resultados-pdf").getPublicUrl(documento.storage_path);
  const esPdf = documento.storage_path.toLowerCase().endsWith(".pdf");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href={`/torneos/${slug}`} className="text-sm text-ajag-gris-500 hover:underline">
        ← {torneo.nombre}
      </Link>
      <h1 className="mt-2 flex items-center gap-2 font-display text-2xl font-semibold text-ajag-verde-900">
        <Trophy size={22} className="text-ajag-oro-600" /> Clasificación
      </h1>

      {esPdf ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-ajag-gris-100">
          <iframe src={data.publicUrl} className="h-[75vh] w-full" title="Clasificación" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.publicUrl}
          alt={`Clasificación de ${torneo.nombre}`}
          className="mt-6 w-full rounded-2xl border border-ajag-gris-100"
        />
      )}

      <a
        href={data.publicUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block text-sm font-medium text-ajag-verde-700 hover:underline"
      >
        Abrir en una pestaña nueva ↗
      </a>

      <div className="mt-6">
        <CuadroDeHonor torneo={torneo} />
      </div>
    </div>
  );
}
