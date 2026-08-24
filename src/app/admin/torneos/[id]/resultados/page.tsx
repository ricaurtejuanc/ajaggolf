import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  obtenerInscritosConfirmadosParaResultados,
  type InscritoParaResultado,
} from "@/lib/data/resultados";
import { emparejarConInscritos, type FilaExtraidaPdf } from "@/lib/resultados/extraer-pdf";
import { DocumentoUploader } from "./documento-uploader";
import { ResultadosForm, type CategoriaClasificacion } from "./resultados-form";
import { filaVacia, type FilaResultado } from "./fila-resultado";
import { DocumentoActual } from "./documento-actual";
import { GanadoresPremiosForm } from "./ganadores-premios-form";
import { PosicionesLigaForm } from "./posiciones-liga-form";
import { ClasificacionGeneralToggle } from "./clasificacion-general-toggle";
import type { Resultado } from "@/types/database";

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
    .select("id, nombre, slug, liga_pool_id, formato_puntuacion, premios, premios_ganadores")
    .eq("id", id)
    .maybeSingle();
  if (!torneo) notFound();

  const [{ data: documento }, confirmados, { data: resultados }] = await Promise.all([
    supabase
      .from("resultados_pdf_uploads")
      .select("*")
      .eq("torneo_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    obtenerInscritosConfirmadosParaResultados(id),
    supabase
      .from("resultados")
      .select("*")
      .eq("torneo_id", id)
      .order("posicion", { ascending: true, nullsFirst: false }),
  ]);

  const documentoFilasExtraidas =
    (documento?.filas_extraidas as { filas?: FilaExtraidaPdf[] } | null)?.filas ?? [];
  // Coincidencias del PDF/foto subido por nombre con los inscritos confirmados:
  // se usan para autocompletar tanto el cuadro de honor como los puestos de
  // la liga, así el admin solo tiene que revisar en vez de rellenar a mano.
  const sugerenciasPdf =
    documentoFilasExtraidas.length > 0
      ? emparejarConInscritos(documentoFilasExtraidas, confirmados)
      : new Map<string, FilaExtraidaPdf>();
  const sugerenciasPosicion: Record<string, number> = {};
  for (const [inscripcionId, fila] of sugerenciasPdf) {
    sugerenciasPosicion[inscripcionId] = fila.posicion;
  }

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

      {torneo.liga_pool_id ? (
        <>
          <ClasificacionGeneralToggle
            hayDocumento={Boolean(documento)}
            documentoUploader={
              <div className="flex flex-col gap-4">
                <DocumentoUploader torneoId={id} />
                {documento ? <DocumentoActual torneoId={id} documento={documento} /> : null}
              </div>
            }
            tablaManual={
              <TablaResultados
                torneoId={id}
                formatoPuntuacion={torneo.formato_puntuacion}
                confirmados={confirmados}
                documentoFilasExtraidas={documentoFilasExtraidas}
                resultados={resultados ?? []}
                categorias={torneo.premios
                  .filter((c) => !c.categoria_unica)
                  .map((c) => ({
                    nombre: c.nombre,
                    handicapDesde: c.handicap_desde,
                    handicapHasta: c.handicap_hasta,
                  }))}
              />
            }
          />

          <GanadoresPremiosForm
            torneoId={id}
            premios={torneo.premios}
            ganadoresIniciales={torneo.premios_ganadores}
            confirmados={confirmados}
            sugerenciasPosicion={sugerenciasPosicion}
          />

          <PosicionesLiga
            torneoId={id}
            ligaPoolId={torneo.liga_pool_id}
            confirmados={confirmados}
            sugerenciasPosicion={sugerenciasPosicion}
            resultados={resultados ?? []}
          />
        </>
      ) : (
        <>
          <div className="mb-6">
            <DocumentoUploader torneoId={id} />
          </div>

          {documento ? <DocumentoActual torneoId={id} documento={documento} /> : null}

          <GanadoresPremiosForm
            torneoId={id}
            premios={torneo.premios}
            ganadoresIniciales={torneo.premios_ganadores}
            confirmados={confirmados}
            sugerenciasPosicion={sugerenciasPosicion}
          />

          <p className="mt-6 text-sm text-ajag-gris-500">
            Este torneo no pertenece a ninguna liga/pool, así que no necesita una
            clasificación estructurada: con subir el PDF o la foto y publicarlo
            es suficiente.
          </p>
        </>
      )}
    </div>
  );
}

async function PosicionesLiga({
  torneoId,
  ligaPoolId,
  confirmados,
  sugerenciasPosicion,
  resultados,
}: {
  torneoId: string;
  ligaPoolId: string;
  confirmados: InscritoParaResultado[];
  sugerenciasPosicion: Record<string, number>;
  resultados: Resultado[];
}) {
  const supabase = await createClient();
  const { data: liga } = await supabase
    .from("ligas_pool")
    .select("tabla_puntos")
    .eq("id", ligaPoolId)
    .maybeSingle();
  if (!liga) return null;

  const tablaPuntos = liga.tabla_puntos as Record<string, number>;
  const posiciones = Object.keys(tablaPuntos)
    .filter((k) => k !== "resto")
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  if (posiciones.length === 0) return null;

  const posicionesIniciales: Record<string, string> = {};
  for (const r of resultados) {
    if (r.posicion != null && r.inscripcion_id && posiciones.includes(r.posicion)) {
      posicionesIniciales[String(r.posicion)] = r.inscripcion_id;
    }
  }
  // Si todavía no hay resultados guardados para un puesto, usa la coincidencia
  // del PDF/foto subido (por nombre) como sugerencia de partida.
  let sugeridoDesdePdf = false;
  if (Object.keys(posicionesIniciales).length === 0) {
    for (const [inscripcionId, posicion] of Object.entries(sugerenciasPosicion)) {
      if (posiciones.includes(posicion)) {
        posicionesIniciales[String(posicion)] = inscripcionId;
        sugeridoDesdePdf = true;
      }
    }
  }

  return (
    <PosicionesLigaForm
      torneoId={torneoId}
      ligaPoolId={ligaPoolId}
      posiciones={posiciones}
      tablaPuntos={tablaPuntos}
      confirmados={confirmados}
      posicionesIniciales={posicionesIniciales}
      sugeridoDesdePdf={sugeridoDesdePdf}
    />
  );
}

function TablaResultados({
  torneoId,
  formatoPuntuacion,
  confirmados,
  documentoFilasExtraidas,
  resultados,
  categorias,
}: {
  torneoId: string;
  formatoPuntuacion: "stableford" | "medal_play";
  confirmados: InscritoParaResultado[];
  documentoFilasExtraidas: FilaExtraidaPdf[];
  resultados: Resultado[];
  categorias: CategoriaClasificacion[];
}) {
  let filasIniciales: FilaResultado[];

  if (resultados.length > 0) {
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
      categorias={categorias}
    />
  );
}
