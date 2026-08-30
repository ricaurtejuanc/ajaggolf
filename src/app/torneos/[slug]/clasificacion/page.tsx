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
import { ClasificacionManual, type GrupoClasificacionManual } from "./clasificacion-manual";

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

    const gruposPorCategoria = new Map<string, GrupoClasificacionManual>();
    for (const r of resultados) {
      const existente = gruposPorCategoria.get(r.categoria);
      if (existente) existente.resultados.push(r);
      else
        gruposPorCategoria.set(r.categoria, {
          categoria: r.categoria,
          etiqueta: etiquetaCategoriaClasificacion[r.categoria],
          resultados: [r],
        });
    }
    const grupos = Array.from(gruposPorCategoria.values()).sort(
      (a, b) => ordenCategoriaClasificacion(a.categoria) - ordenCategoriaClasificacion(b.categoria),
    );

    general = <ClasificacionManual grupos={grupos} columnaPrincipal={columnaPrincipal} />;
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
