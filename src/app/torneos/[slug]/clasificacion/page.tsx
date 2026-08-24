import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { obtenerTorneoPorSlug } from "@/lib/data/torneos";
import { CuadroDeHonor, hayCuadroDeHonor } from "@/components/torneos/cuadro-de-honor";
import { ClasificacionTabs } from "./clasificacion-tabs";

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
  const cuadroHonor = hayCuadroDeHonor(torneo) ? <CuadroDeHonor torneo={torneo} /> : null;

  // Si el torneo pertenece a una liga/pool, "atrás" lleva al listado
  // general de clasificaciones (de donde suele venir el usuario), no a la
  // ficha del torneo.
  const { data: liga } = torneo.liga_pool_id
    ? await supabase.from("ligas_pool").select("slug").eq("id", torneo.liga_pool_id).maybeSingle()
    : { data: null };
  const hrefVolver = liga ? "/clasificaciones" : `/torneos/${slug}`;
  const textoVolver = liga ? "Clasificaciones" : torneo.nombre;

  const { data: documento } = await supabase
    .from("resultados_pdf_uploads")
    .select("storage_path, nombre_archivo")
    .eq("torneo_id", torneo.id)
    .eq("estado", "publicado")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // La clasificación general con todos los jugadores solo sale del PDF/foto
  // publicado, o de la tabla rellenada a mano en el admin (marcada como
  // es_clasificacion_general, sea o no torneo de liga). Los puestos
  // guardados solo para puntuar en una liga/pool no cuentan aquí: esos se
  // ven en la clasificación de la liga, no en la ficha de este torneo.
  const { data: resultados } = !documento
    ? await supabase
        .from("resultados")
        .select("*")
        .eq("torneo_id", torneo.id)
        .eq("estado", "publicado")
        .eq("es_clasificacion_general", true)
        .order("posicion", { ascending: true, nullsFirst: false })
    : { data: null };

  if (!documento && (!resultados || resultados.length === 0) && !cuadroHonor) notFound();

  let general: ReactNode = (
    <div className="card-ajag p-6 text-sm text-ajag-gris-500">
      Todavía no hay clasificación general publicada.
    </div>
  );

  if (documento) {
    const { data } = supabase.storage.from("resultados-pdf").getPublicUrl(documento.storage_path);
    const esPdf = documento.storage_path.toLowerCase().endsWith(".pdf");
    general = (
      <div>
        {esPdf ? (
          <div className="overflow-hidden rounded-2xl border border-ajag-gris-100">
            <iframe
              src={`${data.publicUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
              className="h-[75vh] w-full pointer-events-none"
              title="Clasificación"
            />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.publicUrl}
            alt={`Clasificación de ${torneo.nombre}`}
            className="w-full rounded-2xl border border-ajag-gris-100"
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
      </div>
    );
  } else if (resultados && resultados.length > 0) {
    const columnaPrincipal = torneo.formato_puntuacion === "stableford" ? "puntos" : "golpes";
    general = (
      <div className="overflow-x-auto rounded-2xl border border-ajag-gris-100 bg-white">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-ajag-gris-100 text-xs uppercase text-ajag-gris-500">
            <tr>
              <th className="px-4 py-3">Pos.</th>
              <th className="px-4 py-3">Jugador</th>
              <th className="px-4 py-3">Hcp</th>
              <th className="px-4 py-3">{columnaPrincipal === "puntos" ? "Puntos" : "Golpes"}</th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((r) => (
              <tr key={r.id} className="border-b border-ajag-gris-100 last:border-0">
                <td className="px-4 py-3 font-medium text-ajag-verde-900">{r.posicion ?? "—"}</td>
                <td className="px-4 py-3 text-ajag-verde-900">{r.nombre_mostrado}</td>
                <td className="px-4 py-3 text-ajag-gris-500">{r.handicap ?? "—"}</td>
                <td className="px-4 py-3 text-ajag-gris-500">
                  {r.estado_juego === "retirado"
                    ? "Retirado"
                    : r.estado_juego === "no_presentado"
                      ? "No presentado"
                      : ((columnaPrincipal === "puntos" ? r.puntos : r.golpes) ?? "—")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href={hrefVolver} className="text-sm text-ajag-gris-500 hover:underline">
        ← {textoVolver}
      </Link>
      <h1 className="mt-2 flex items-center gap-2 font-display text-2xl font-semibold text-ajag-verde-900">
        <Trophy size={22} className="text-ajag-oro-600" /> Clasificación
      </h1>

      <ClasificacionTabs general={general} cuadroHonor={cuadroHonor} />
    </div>
  );
}
