import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { obtenerTorneoPorSlug } from "@/lib/data/torneos";
import { formatearFecha } from "@/lib/format";
import { CuadroDeHonor, hayCuadroDeHonor } from "@/components/torneos/cuadro-de-honor";
import {
  etiquetaCategoriaClasificacion,
  ordenCategoriaClasificacion,
} from "@/lib/resultados/categorias";
import { ClasificacionTabs } from "./clasificacion-tabs";
import { DocumentosCategoria, type DocumentoCategoria } from "./documentos-categoria";

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

  // "Atrás" siempre lleva al listado general de clasificaciones, de donde
  // suele venir el usuario (calendario, liga o directamente el listado),
  // nunca a la ficha del torneo.
  const hrefVolver = "/clasificaciones";
  const textoVolver = "Clasificaciones";

  const { data: documentosPublicados } = await supabase
    .from("resultados_pdf_uploads")
    .select("storage_path, nombre_archivo, categoria, created_at")
    .eq("torneo_id", torneo.id)
    .eq("estado", "publicado")
    .order("created_at", { ascending: false });

  // Una categoría solo puede enseñar un documento: si el admin subió varios
  // para la misma (una corrección, por ejemplo), vale el más reciente. El
  // orden final es el de las categorías, no el de subida.
  const documentos: DocumentoCategoria[] = [];
  for (const doc of documentosPublicados ?? []) {
    if (documentos.some((d) => d.categoria === doc.categoria)) continue;
    const { data } = supabase.storage.from("resultados-pdf").getPublicUrl(doc.storage_path);
    documentos.push({
      categoria: doc.categoria,
      etiqueta: etiquetaCategoriaClasificacion[doc.categoria],
      url: data.publicUrl,
      esPdf: doc.storage_path.toLowerCase().endsWith(".pdf"),
    });
  }
  documentos.sort(
    (a, b) => ordenCategoriaClasificacion(a.categoria) - ordenCategoriaClasificacion(b.categoria),
  );
  const hayDocumentos = documentos.length > 0;

  // La clasificación general con todos los jugadores solo sale del PDF/foto
  // publicado, o de la tabla rellenada a mano en el admin (marcada como
  // es_clasificacion_general, sea o no torneo de liga). Los puestos
  // guardados solo para puntuar en una liga/pool no cuentan aquí: esos se
  // ven en la clasificación de la liga, no en la ficha de este torneo.
  const { data: resultados } = !hayDocumentos
    ? await supabase
        .from("resultados")
        .select("*")
        .eq("torneo_id", torneo.id)
        .eq("estado", "publicado")
        .eq("es_clasificacion_general", true)
        .order("posicion", { ascending: true, nullsFirst: false })
    : { data: null };

  if (!hayDocumentos && (!resultados || resultados.length === 0) && !cuadroHonor) notFound();

  let general: ReactNode = (
    <div className="card-ajag p-6 text-sm text-ajag-gris-500">
      Todavía no hay clasificación general publicada.
    </div>
  );

  if (hayDocumentos) {
    general = <DocumentosCategoria documentos={documentos} nombreTorneo={torneo.nombre} />;
  } else if (resultados && resultados.length > 0) {
    const columnaPrincipal = torneo.formato_puntuacion === "stableford" ? "puntos" : "golpes";
    general = (
      <div className="overflow-x-auto rounded-2xl border border-ajag-gris-100 bg-white">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-ajag-gris-100 text-[0.65rem] uppercase text-ajag-gris-500 sm:text-xs">
            <tr>
              <th className="px-2 py-2 sm:px-4 sm:py-3">Pos.</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3">Jugador</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3">Hcp</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3">
                {columnaPrincipal === "puntos" ? "Puntos" : "Golpes"}
              </th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((r) => (
              <tr key={r.id} className="border-b border-ajag-gris-100 last:border-0">
                <td className="px-2 py-2 font-medium text-ajag-verde-900 sm:px-4 sm:py-3">
                  {r.posicion ?? "—"}
                </td>
                <td className="px-2 py-2 text-ajag-verde-900 sm:px-4 sm:py-3">
                  {r.nombre_mostrado}
                </td>
                <td className="px-2 py-2 text-ajag-gris-500 sm:px-4 sm:py-3">
                  {r.handicap ?? "—"}
                </td>
                <td className="px-2 py-2 text-ajag-gris-500 sm:px-4 sm:py-3">
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
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-ajag-oro-600">
        {formatearFecha(torneo.fecha)}
      </p>
      <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-ajag-verde-900">
        <Trophy size={22} className="text-ajag-oro-600" /> {torneo.nombre}
      </h1>

      <ClasificacionTabs general={general} cuadroHonor={cuadroHonor} />
    </div>
  );
}
