import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerJugadoresConfirmados } from "@/lib/data/salidas";
import { GenerarSalidasForm } from "./generar-form";
import { GruposGrid, type GrupoVista, type JugadorEnGrupoVista } from "./grupos-grid";
import { PublicarButton } from "./publicar-button";
import { HorariosPdfUploader } from "./horarios-pdf-uploader";
import { ExportarSalidasButtons } from "./exportar-salidas-buttons";
import { SalidasTabs } from "./salidas-tabs";
import type { Salida } from "@/types/database";

export const metadata: Metadata = { title: "Salidas · Admin" };

interface GrupoSalidaRaw {
  id: string;
  numero_grupo: number;
  hoyo_salida: number;
  hora_salida: string | null;
  grupo_salida_jugadores: {
    id: string;
    inscripcion_id: string;
    conflicto_juega_con: boolean;
    conflicto_detalle: string | null;
    inscripciones: {
      licencia_federativa: string | null;
      juega_con_licencias: string[];
      handicap_snapshot: number | null;
      jugadores: {
        nombre: string;
        apellidos: string;
        handicap: number | null;
        sexo: string | null;
      } | null;
    } | null;
  }[];
}

type SalidaConGruposRaw = Salida & { grupos_salida: GrupoSalidaRaw[] };

export default async function AdminSalidasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("torneos")
    .select(
      "id, nombre, slug, modo_salida, modo_asignacion_salida, tees_consecutivo, horarios_pdf_url",
    )
    .eq("id", id)
    .maybeSingle();
  if (!torneo) notFound();

  const [{ data: salidaRaw }, jugadoresConfirmados] = await Promise.all([
    supabase
      .from("salidas")
      .select(
        "*, grupos_salida(id, numero_grupo, hoyo_salida, hora_salida, grupo_salida_jugadores(id, inscripcion_id, conflicto_juega_con, conflicto_detalle, inscripciones(licencia_federativa, juega_con_licencias, handicap_snapshot, jugadores(nombre, apellidos, handicap, sexo))))",
      )
      .eq("torneo_id", id)
      .maybeSingle(),
    obtenerJugadoresConfirmados(id),
  ]);
  const salida = salidaRaw as unknown as SalidaConGruposRaw | null;

  const grupos: GrupoVista[] = (salida?.grupos_salida ?? [])
    .slice()
    .sort((a, b) => a.numero_grupo - b.numero_grupo)
    .map((g) => ({
      id: g.id,
      numeroGrupo: g.numero_grupo,
      hoyoSalida: g.hoyo_salida,
      horaSalida: g.hora_salida,
    }));

  const jugadoresPorGrupo: Record<string, JugadorEnGrupoVista[]> = {};
  const idsAsignados = new Set<string>();

  for (const g of salida?.grupos_salida ?? []) {
    jugadoresPorGrupo[g.id] = (g.grupo_salida_jugadores ?? []).map((gj) => {
      idsAsignados.add(gj.inscripcion_id);
      const insc = gj.inscripciones;
      const jugador = insc?.jugadores;
      return {
        inscripcionId: gj.inscripcion_id,
        nombre: jugador ? `${jugador.nombre} ${jugador.apellidos}`.trim() : "Jugador",
        handicap: insc?.handicap_snapshot ?? jugador?.handicap ?? null,
        sexo: jugador?.sexo ?? null,
        licenciaFederativa: insc?.licencia_federativa ?? null,
        juegaConLicencias: insc?.juega_con_licencias ?? [],
        conflictoJuegaCon: gj.conflicto_juega_con,
        conflictoDetalle: gj.conflicto_detalle,
      };
    });
  }

  const nombresPorLicencia: Record<string, string> = {};
  for (const j of jugadoresConfirmados) {
    if (j.licenciaFederativa) nombresPorLicencia[j.licenciaFederativa] = j.nombre;
  }

  const sinAsignar: JugadorEnGrupoVista[] = jugadoresConfirmados
    .filter((j) => !idsAsignados.has(j.inscripcionId))
    .map((j) => ({
      inscripcionId: j.inscripcionId,
      nombre: j.nombre,
      handicap: j.handicap,
      sexo: j.sexo,
      licenciaFederativa: j.licenciaFederativa,
      juegaConLicencias: j.juegaConLicencias,
      conflictoJuegaCon: false,
      conflictoDetalle: null,
    }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <Link href="/admin/torneos" className="text-sm text-ajag-gris-500 hover:underline">
            ← Torneos
          </Link>
          <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">
            Salidas
          </h1>
        </div>
        {salida ? (
          <PublicarButton torneoId={id} salidaId={salida.id} estado={salida.estado} />
        ) : null}
      </div>

      <h1 className="mb-4 hidden font-display text-2xl font-semibold text-ajag-verde-900 print:block">
        Salidas — {torneo.nombre}
      </h1>

      <SalidasTabs
        defaultTab={torneo.horarios_pdf_url && !salida ? "pdf" : "generar"}
        pdfSection={<HorariosPdfUploader torneoId={id} pdfUrlInicial={torneo.horarios_pdf_url} />}
        generarSection={
          <GenerarSalidasForm
            torneoId={id}
            modoSalidaDefecto={torneo.modo_salida}
            modoAsignacionDefecto={torneo.modo_asignacion_salida}
            teesConsecutivoDefecto={torneo.tees_consecutivo}
            salidaExistente={salida}
            nJugadoresConfirmados={jugadoresConfirmados.length}
          />
        }
      />

      {salida && grupos.length > 0 ? (
        <div className="mt-6">
          <ExportarSalidasButtons
            torneoNombre={torneo.nombre}
            torneoSlug={torneo.slug}
            grupos={grupos}
            jugadoresPorGrupo={jugadoresPorGrupo}
          />
          <GruposGrid
            torneoId={id}
            grupos={grupos}
            jugadoresPorGrupo={jugadoresPorGrupo}
            sinAsignar={sinAsignar}
            nombresPorLicencia={nombresPorLicencia}
          />
        </div>
      ) : null}
    </div>
  );
}
