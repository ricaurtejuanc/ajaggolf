import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Flag, Coins, Users, Trophy, Check, Eye } from "lucide-react";
import { obtenerTorneoPorSlug } from "@/lib/data/torneos";
import { createClient } from "@/lib/supabase/server";
import { formatearFecha, formatearHora, formatearPrecio } from "@/lib/format";
import { PosterLightbox } from "@/components/torneos/poster-lightbox";
import { obtenerCategoriasExtras } from "@/lib/data/configuracion";

const etiquetaFormato = {
  stableford: "Stableford",
  medal_play: "Medal Play",
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const torneo = await obtenerTorneoPorSlug(slug);
  return { title: torneo?.nombre ?? "Torneo" };
}

export default async function TorneoDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const torneo = await obtenerTorneoPorSlug(slug);
  if (!torneo) notFound();

  const supabase = await createClient();
  const ligaPromise = torneo.liga_pool_id
    ? supabase.from("ligas_pool").select("nombre, slug").eq("id", torneo.liga_pool_id).maybeSingle()
    : Promise.resolve({ data: null });
  const cupoPromise = supabase
    .from("torneos_cupo")
    .select("inscritos")
    .eq("torneo_id", torneo.id)
    .maybeSingle();
  const salidaPromise = supabase
    .from("salidas")
    .select("id")
    .eq("torneo_id", torneo.id)
    .eq("estado", "publicado")
    .maybeSingle();
  const clasificacionPromise = torneo.liga_pool_id
    ? supabase
        .from("resultados")
        .select("id", { count: "exact", head: true })
        .eq("torneo_id", torneo.id)
        .eq("estado", "publicado")
    : supabase
        .from("resultados_pdf_uploads")
        .select("id", { count: "exact", head: true })
        .eq("torneo_id", torneo.id)
        .eq("estado", "publicado");

  const [{ data: liga }, { data: cupo }, { data: salidaPublicada }, { count: nResultados }, categoriasExtras] =
    await Promise.all([
      ligaPromise,
      cupoPromise,
      salidaPromise,
      clasificacionPromise,
      obtenerCategoriasExtras(),
    ]);

  const inscritos = cupo?.inscritos ?? 0;
  const cerrado = torneo.estado !== "publicado";
  const lleno = torneo.cupo_maximo != null && inscritos >= torneo.cupo_maximo;
  const partesTees = [
    torneo.tees_masculino.length ? `Caballeros: ${torneo.tees_masculino.join(", ")}` : null,
    torneo.tees_femenino.length ? `Damas: ${torneo.tees_femenino.join(", ")}` : null,
  ].filter((p): p is string => p != null);
  const textoTees = partesTees.length ? partesTees.join(" · ") : "Por confirmar";
  const textoPrecio =
    (torneo.precio_socio_cents != null
      ? `${formatearPrecio(torneo.precio_socio_cents)} socios · ${formatearPrecio(torneo.precio_cents)} no socios`
      : formatearPrecio(torneo.precio_cents)) + (torneo.modo_pago === "club" ? " · pago en el club" : "");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {torneo.estado === "borrador" ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-ajag-oro-500/15 px-4 py-3 text-sm font-medium text-ajag-oro-600">
          <Eye size={16} className="shrink-0" />
          Vista previa: este torneo está en borrador y todavía no es público. Solo tú, como
          admin, puedes verlo aquí.
        </div>
      ) : null}

      {torneo.poster_url ? (
        <PosterLightbox
          posterUrl={torneo.poster_url}
          alt={torneo.nombre}
          focalX={torneo.poster_focal_x}
          focalY={torneo.poster_focal_y}
        />
      ) : (
        <div className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-2xl bg-ajag-verde-100 text-ajag-verde-700/50">
          <CalendarDays size={56} />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-1">
        {liga ? (
          <Link
            href={`/clasificaciones/${liga.slug}`}
            className="w-fit rounded-full bg-ajag-oro-500/20 px-3 py-1 text-xs font-medium text-ajag-oro-600"
          >
            Puntúa para {liga.nombre}
          </Link>
        ) : null}
        <h1 className="font-display text-3xl font-semibold text-ajag-verde-900">
          {torneo.nombre}
        </h1>
        <p className="text-ajag-gris-500">{formatearFecha(torneo.fecha)}</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <InfoPill
          icon={<MapPin size={16} />}
          label="Campo"
          value={torneo.recorrido ? `${torneo.campo_golf} · ${torneo.recorrido}` : torneo.campo_golf}
        />
        <InfoPill icon={<Flag size={16} />} label="Tees" value={textoTees} />
        <InfoPill
          icon={<CalendarDays size={16} />}
          label="Hora"
          value={formatearHora(torneo.hora_inicio) ?? "Por confirmar"}
        />
        <InfoPill icon={<Coins size={16} />} label="Precio" value={textoPrecio} />
        <InfoPill
          icon={<Trophy size={16} />}
          label="Formato"
          value={etiquetaFormato[torneo.formato_puntuacion]}
        />
      </div>

      {torneo.descripcion ? (
        <p className="mt-6 whitespace-pre-line text-ajag-verde-900/90">{torneo.descripcion}</p>
      ) : null}

      {torneo.info_adicional ? (
        <div className="mt-6 card-ajag p-5">
          <h2 className="mb-2 font-display text-base font-semibold text-ajag-verde-900">
            Información adicional
          </h2>
          <p className="whitespace-pre-line text-sm text-ajag-gris-500">
            {torneo.info_adicional}
          </p>
        </div>
      ) : null}

      {torneo.premios.length > 0 ? (
        <div className="mt-6 card-ajag p-5">
          <h2 className="mb-3 font-display text-base font-semibold text-ajag-verde-900">
            Premios
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {torneo.premios.map((cat, indiceCategoria) => {
              const rango = cat.categoria_unica
                ? "Categoría única"
                : cat.handicap_desde != null && cat.handicap_hasta != null
                  ? `Hándicap ${cat.handicap_desde}–${cat.handicap_hasta}`
                  : cat.handicap_hasta != null
                    ? `Hándicap hasta ${cat.handicap_hasta}`
                    : cat.handicap_desde != null
                      ? `Hándicap desde ${cat.handicap_desde}`
                      : null;
              return (
                <div key={cat.nombre}>
                  <p className="text-sm font-medium text-ajag-verde-900">{cat.nombre}</p>
                  {rango ? <p className="text-xs text-ajag-gris-500">{rango}</p> : null}
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {cat.premios.map((premio, indicePremio) => {
                      const ganador =
                        torneo.premios_ganadores[`${indiceCategoria}-${indicePremio}`];
                      return (
                        <li
                          key={premio}
                          className="flex items-center gap-1.5 text-sm text-ajag-verde-900"
                        >
                          <Trophy size={13} className="shrink-0 text-ajag-oro-600" />
                          {premio}
                          {ganador ? (
                            <span className="text-ajag-gris-500"> — {ganador}</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {torneo.extras.length > 0 ? (
        <div className="mt-6 card-ajag p-5">
          <h2 className="mb-3 font-display text-base font-semibold text-ajag-verde-900">
            Qué incluye
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoriasExtras.map((cat) => {
              const seleccionados = cat.opciones.filter((o) => torneo.extras.includes(o.value));
              if (seleccionados.length === 0) return null;
              return (
                <div key={cat.categoria}>
                  <p className="text-xs font-medium uppercase tracking-wide text-ajag-oro-600">
                    {cat.categoria}
                  </p>
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {seleccionados.map((o) => (
                      <li
                        key={o.value}
                        className="flex items-center gap-1.5 text-sm text-ajag-verde-900"
                      >
                        <Check size={14} className="shrink-0 text-ajag-verde-700" />
                        {o.label}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex items-center justify-between rounded-2xl border border-ajag-gris-100 bg-white p-5">
        <p className="flex items-center gap-1 text-sm text-ajag-gris-500">
          <Users size={15} />
          {inscritos}
          {torneo.cupo_maximo ? ` / ${torneo.cupo_maximo}` : ""} inscritos
          {torneo.cupo_maximo != null
            ? ` · ${Math.max(torneo.cupo_maximo - inscritos, 0)} plazas disponibles`
            : ""}
        </p>

        {cerrado || lleno ? (
          <span className="rounded-full bg-ajag-gris-100 px-5 py-2.5 text-sm font-medium text-ajag-gris-500">
            {lleno ? "Cupo completo" : "Inscripciones cerradas"}
          </span>
        ) : (
          <Link
            href={`/torneos/${torneo.slug}/inscripcion`}
            className="rounded-full bg-ajag-verde-700 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600"
          >
            Inscribirme
          </Link>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {salidaPublicada ? (
          <Link
            href={`/torneos/${torneo.slug}/salidas`}
            className="flex flex-1 items-center justify-center rounded-2xl border border-ajag-verde-700 px-5 py-3 text-sm font-medium text-ajag-verde-700 transition hover:bg-ajag-verde-50"
          >
            Ver cuadro de salidas
          </Link>
        ) : torneo.horarios_pdf_url ? (
          <a
            href={torneo.horarios_pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center rounded-2xl border border-ajag-verde-700 px-5 py-3 text-sm font-medium text-ajag-verde-700 transition hover:bg-ajag-verde-50"
          >
            Ver horarios (PDF)
          </a>
        ) : null}
        {(nResultados ?? 0) > 0 ? (
          <Link
            href={`/torneos/${torneo.slug}/clasificacion`}
            className="flex flex-1 items-center justify-center rounded-2xl border border-ajag-verde-700 px-5 py-3 text-sm font-medium text-ajag-verde-700 transition hover:bg-ajag-verde-50"
          >
            Ver clasificación
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function InfoPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-ajag-gris-100 bg-white p-3">
      <p className="flex items-center gap-1.5 text-xs text-ajag-gris-500">
        {icon} {label}
      </p>
      <p className="mt-1 text-sm font-medium text-ajag-verde-900">{value}</p>
    </div>
  );
}
