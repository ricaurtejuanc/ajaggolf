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
import { ordenCategoriaClasificacion } from "@/lib/resultados/categorias";
import type { FormatoPuntuacion, Resultado } from "@/types/database";

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
    .select(
      "id, nombre, slug, liga_pool_id, formato_puntuacion, premios, premios_hoyo, premios_ganadores",
    )
    .eq("id", id)
    .maybeSingle();
  if (!torneo) notFound();

  const [{ data: documentos }, confirmados, { data: resultados }] = await Promise.all([
    supabase
      .from("resultados_pdf_uploads")
      .select("*")
      .eq("torneo_id", id)
      .order("created_at", { ascending: false }),
    obtenerInscritosConfirmadosParaResultados(id),
    supabase
      .from("resultados")
      .select("*")
      .eq("torneo_id", id)
      .order("posicion", { ascending: true, nullsFirst: false }),
  ]);

  // Un torneo puede tener un documento por categoría; para autocompletar
  // cuadro de honor y puestos de liga usamos el más reciente que traiga
  // filas legibles (los ordenamos de más nuevo a más viejo).
  const documentosOrdenados = (documentos ?? [])
    .slice()
    .sort(
      (a, b) =>
        ordenCategoriaClasificacion(a.categoria) - ordenCategoriaClasificacion(b.categoria),
    );
  const documentoFilasExtraidas =
    (documentos ?? [])
      .map((d) => (d.filas_extraidas as { filas?: FilaExtraidaPdf[] } | null)?.filas ?? [])
      .find((filas) => filas.length > 0) ?? [];
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
  // Las posiciones ya guardadas en la tabla manual (a mano o generadas con
  // "Generar clasificación") son más fiables que una sugerencia del PDF, así
  // que mandan si existen: así el cuadro de honor también se autocompleta a
  // partir de la clasificación general, no solo de un PDF/foto subido.
  for (const r of resultados ?? []) {
    if (r.inscripcion_id && r.posicion != null) {
      sugerenciasPosicion[r.inscripcion_id] = r.posicion;
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/torneos" className="text-sm text-ajag-gris-500 hover:underline">
          ← Torneos
        </Link>
        <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">
          Resultados
        </h1>
      </div>

      <ClasificacionGeneralToggle
        hayDocumento={documentosOrdenados.length > 0}
        documentoUploader={
          <div className="flex flex-col gap-4">
            <DocumentoUploader
              torneoId={id}
              categoriasSubidas={documentosOrdenados.map((d) => d.categoria)}
            />
            {documentosOrdenados.map((documento) => (
              <DocumentoActual key={documento.id} torneoId={id} documento={documento} />
            ))}
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
        premiosHoyo={torneo.premios_hoyo}
        ganadoresIniciales={torneo.premios_ganadores}
        confirmados={confirmados}
        sugerenciasPosicion={sugerenciasPosicion}
      />

      {torneo.liga_pool_id ? (
        <PosicionesLiga
          torneoId={id}
          ligaPoolId={torneo.liga_pool_id}
          confirmados={confirmados}
          sugerenciasPosicion={sugerenciasPosicion}
          resultados={resultados ?? []}
        />
      ) : null}
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
  formatoPuntuacion: FormatoPuntuacion;
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
        estadoJuego: (r.estado_juego as "retirado" | "no_presentado" | null) ?? "",
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
