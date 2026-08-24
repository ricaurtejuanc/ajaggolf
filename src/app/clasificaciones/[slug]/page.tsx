import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { obtenerLigaPorSlug } from "@/lib/data/ligas";
import { createClient } from "@/lib/supabase/server";
import { TorneoCard } from "@/components/torneos/torneo-card";
import { ClasificacionLigaTable, type FilaClasificacionLiga } from "./clasificacion-liga-table";

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
  const [{ data: clasificacion }, { data: resultados }] = await Promise.all([
    supabase
      .from("clasificacion_publica")
      .select("*")
      .eq("liga_pool_id", liga.id)
      .order("puntos_totales", { ascending: false }),
    torneos.length > 0
      ? supabase
          .from("resultados")
          .select("jugador_id, posicion, torneo_id")
          .in(
            "torneo_id",
            torneos.map((t) => t.id),
          )
          .eq("estado", "publicado")
          .not("jugador_id", "is", null)
      : Promise.resolve({ data: [] as { jugador_id: string | null; posicion: number | null; torneo_id: string }[] }),
  ]);

  const tablaPuntos = liga.tabla_puntos as Record<string, number>;
  const torneosPorId = new Map(torneos.map((t) => [t.id, t]));
  const detallePorJugador = new Map<string, FilaClasificacionLiga["detalle"]>();
  for (const r of resultados ?? []) {
    if (!r.jugador_id || r.posicion == null) continue;
    const torneo = torneosPorId.get(r.torneo_id);
    if (!torneo) continue;
    const puntos = tablaPuntos[String(r.posicion)] ?? tablaPuntos.resto ?? 0;
    const lista = detallePorJugador.get(r.jugador_id) ?? [];
    lista.push({
      torneoSlug: torneo.slug,
      torneoNombre: torneo.nombre,
      fecha: torneo.fecha,
      puntos,
    });
    detallePorJugador.set(r.jugador_id, lista);
  }
  for (const lista of detallePorJugador.values()) {
    lista.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  const filasClasificacion: FilaClasificacionLiga[] = (clasificacion ?? []).map((c) => ({
    jugadorId: c.jugador_id,
    nombre: `${c.nombre} ${c.apellidos}`,
    puntosTotales: c.puntos_totales,
    eventosJugados: c.eventos_jugados,
    detalle: detallePorJugador.get(c.jugador_id) ?? [],
  }));

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

      {filasClasificacion.length === 0 ? (
        <div className="card-ajag p-6 text-sm text-ajag-gris-500">
          La clasificación se publicará en cuanto haya resultados de algún
          torneo de esta liga.
        </div>
      ) : (
        <ClasificacionLigaTable filas={filasClasificacion} />
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
