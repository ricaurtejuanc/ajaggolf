import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerInscritosConfirmadosParaResultados } from "@/lib/data/resultados";
import { emparejarConInscritos, type FilaExtraidaPdf } from "@/lib/resultados/extraer-pdf";
import { DocumentoUploader } from "./documento-uploader";
import { ResultadosForm, filaVacia, type FilaResultado } from "./resultados-form";
import { DocumentoActual } from "./documento-actual";

export const metadata: Metadata = { title: "Resultados · Admin" };

export default async function AdminResultadosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("torneos")
    .select("id, nombre, slug, liga_pool_id, formato_puntuacion")
    .eq("id", id)
    .maybeSingle();
  if (!torneo) notFound();

  const { data: documento } = await supabase
    .from("resultados_pdf_uploads")
    .select("*")
    .eq("torneo_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/torneos/${id}/editar`}
          className="text-sm text-ajag-gris-500 hover:underline"
        >
          ← {torneo.nombre}
        </Link>
        <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">
          Resultados
        </h1>
      </div>

      <div className="mb-6">
        <DocumentoUploader torneoId={id} />
      </div>

      {documento ? <DocumentoActual torneoId={id} documento={documento} /> : null}

      {torneo.liga_pool_id ? (
        <div className="mt-6">
          <TablaResultados
            torneoId={id}
            formatoPuntuacion={torneo.formato_puntuacion}
            documentoFilasExtraidas={
              (documento?.filas_extraidas as { filas?: FilaExtraidaPdf[] } | null)?.filas ?? []
            }
          />
        </div>
      ) : (
        <p className="mt-6 text-sm text-ajag-gris-500">
          Este torneo no pertenece a ninguna liga/pool, así que no necesita una
          clasificación estructurada: con subir el PDF o la foto y publicarlo
          es suficiente.
        </p>
      )}
    </div>
  );
}

async function TablaResultados({
  torneoId,
  formatoPuntuacion,
  documentoFilasExtraidas,
}: {
  torneoId: string;
  formatoPuntuacion: "stableford" | "medal_play";
  documentoFilasExtraidas: FilaExtraidaPdf[];
}) {
  const supabase = await createClient();
  const { data: resultados } = await supabase
    .from("resultados")
    .select("*")
    .eq("torneo_id", torneoId)
    .order("posicion", { ascending: true, nullsFirst: false });

  let filasIniciales: FilaResultado[];

  if (resultados && resultados.length > 0) {
    filasIniciales = resultados.map((r) =>
      filaVacia({
        inscripcionId: r.inscripcion_id,
        nombreMostrado: r.nombre_mostrado,
        licenciaFederativa: r.licencia_federativa ?? "",
        handicap: r.handicap != null ? String(r.handicap) : "",
        posicion: r.posicion != null ? String(r.posicion) : "",
        puntos: r.puntos != null ? String(r.puntos) : "",
        golpes: r.golpes != null ? String(r.golpes) : "",
      }),
    );
  } else {
    const confirmados = await obtenerInscritosConfirmadosParaResultados(torneoId);
    const sugerencias =
      documentoFilasExtraidas.length > 0
        ? emparejarConInscritos(documentoFilasExtraidas, confirmados)
        : new Map<string, FilaExtraidaPdf>();

    filasIniciales = confirmados.map((c) => {
      const sugerencia = sugerencias.get(c.inscripcionId);
      return filaVacia({
        inscripcionId: c.inscripcionId,
        nombreMostrado: c.nombreCompleto,
        licenciaFederativa: c.licenciaFederativa ?? "",
        handicap: c.handicap != null ? String(c.handicap) : "",
        posicion: sugerencia ? String(sugerencia.posicion) : "",
        puntos: sugerencia && formatoPuntuacion === "stableford" ? String(sugerencia.valor) : "",
        golpes: sugerencia && formatoPuntuacion === "medal_play" ? String(sugerencia.valor) : "",
      });
    });
  }

  return (
    <ResultadosForm
      torneoId={torneoId}
      formatoPuntuacion={formatoPuntuacion}
      filasIniciales={filasIniciales}
    />
  );
}
