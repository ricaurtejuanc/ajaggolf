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
import { hayCuadroDeHonor } from "@/components/torneos/cuadro-de-honor";

const etiquetaFormato = {
  stableford: "Stableford",
  medal_play: "Medal Play",
  parejas: "Por parejas",
  mejor_bola: "Mejor bola",
  scramble: "Scramble",
  matchplay: "Match Play",
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
  // La clasificación general puede venir de un PDF/foto publicado o de la
  // tabla rellenada a mano (marcada como es_clasificacion_general, sea o
  // no torneo de liga); los puestos guardados solo para puntuar en la
  // liga no cuentan aquí.
  const pdfPromise = supabase
    .from("resultados_pdf_uploads")
    .select("id", { count: "exact", head: true })
    .eq("torneo_id", torneo.id)
    .eq("estado", "publicado");
  const resultadosPromise = supabase
    .from("resultados")
    .select("id", { count: "exact", head: true })
    .eq("torneo_id", torneo.id)
    .eq("estado", "publicado")
    .eq("es_clasificacion_general", true);

  const [
    { data: liga },
    { data: cupo },
    { data: salidaPublicada },
    { count: nPdf },
    { count: nResultados },
    categoriasExtras,
  ] = await Promise.all([
    ligaPromise,
    cupoPromise,
    salidaPromise,
    pdfPromise,
    resultadosPromise,
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
  const hayHorarios = Boolean(salidaPublicada) || Boolean(torneo.horarios_pdf_url);
  const hayClasificacion = (nPdf ?? 0) > 0 || (nResultados ?? 0) > 0 || hayCuadroDeHonor(torneo);
  const textoPrecio =
    (torneo.precio_socio_cents != null
      ? `${formatearPrecio(torneo.precio_socio_cents)} socios · ${formatearPrecio(torneo.precio_cents)} no socios`
      : formatearPrecio(torneo.precio_cents)) + (torneo.modo_pago === "club" ? " · pago en el club" : "");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href={torneo.estado === "borrador" ? "/admin/torneos" : "/torneos"}
        className="mb-4 inline-block text-sm text-ajag-gris-500 hover:underline"
      >
        {torneo.estado === "borrador" ? "← Volver" : "← Calendario"}
      </Link>

      {torneo.estado === "borrador" ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-ajag-oro-500/15 px-4 py-3 text-sm font-medium text-ajag-oro-600">
          <Eye size={16} className="shrink-0" />
          Vista previa: este torneo está en borrador y todavía no es público. Solo tú, como
          admin, puedes verlo aquí.
        </div>
      ) : null}

      {torneo.estado === "cancelado" ? (
        <div className="mb-4 rounded-xl bg-ajag-rojo-600/10 px-4 py-3 text-sm font-medium text-ajag-rojo-600">
          Este torneo ha sido cancelado.
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
                      const ganadores =
                        torneo.premios_ganadores[`${indiceCategoria}-${indicePremio}`] ?? [];
                      return (
                        <li
                          key={premio}
                          className="flex items-start gap-1.5 text-sm text-ajag-verde-900"
                        >
                          <Trophy size={13} className="mt-0.5 shrink-0 text-ajag-oro-600" />
                          {premio}
                          {ganadores.length > 0 ? (
                            <span className="text-ajag-gris-500"> — {ganadores.join(", ")}</span>
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

      {torneo.premios_hoyo.length > 0 ? (
        <div className="mt-6 card-ajag p-5">
          <h2 className="mb-3 font-display text-base font-semibold text-ajag-verde-900">
            Premios por hoyo
          </h2>
          <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {torneo.premios_hoyo.map((premio, indice) => {
              const ganadores = torneo.premios_ganadores[`hoyo-${indice}`] ?? [];
              return (
                <li
                  key={indice}
                  className="flex items-start gap-1.5 text-sm text-ajag-verde-900"
                >
                  <Trophy size={13} className="mt-0.5 shrink-0 text-ajag-oro-600" />
                  {premio.nombre}
                  {premio.hoyo ? (
                    <span className="text-ajag-gris-500"> (hoyo {premio.hoyo})</span>
                  ) : null}
                  {ganadores.length > 0 ? (
                    <span className="text-ajag-gris-500"> — {ganadores.join(", ")}</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
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
                        className="flex items-start gap-1.5 text-sm text-ajag-verde-900"
                      >
                        <Check size={14} className="mt-0.5 shrink-0 text-ajag-verde-700" />
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

      <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-ajag-gris-100 bg-white p-5">
        <div className="flex flex-col gap-0.5 text-sm text-ajag-gris-500">
          <span className="flex items-center gap-1">
            <Users size={15} />
            {inscritos}
            {torneo.cupo_maximo ? ` / ${torneo.cupo_maximo}` : ""} inscritos
          </span>
          {torneo.cupo_maximo != null ? (
            <span>
              {lleno ? "Completo" : `${Math.max(torneo.cupo_maximo - inscritos, 0)} plazas disponibles`}
            </span>
          ) : null}
        </div>

        {cerrado || lleno ? (
          <span className="w-full rounded-full bg-ajag-gris-100 px-5 py-2.5 text-center text-sm font-medium text-ajag-gris-500">
            {lleno ? "Cupo completo" : "Inscripciones cerradas"}
          </span>
        ) : (
          <Link
            href={`/torneos/${torneo.slug}/inscripcion`}
            className="w-full rounded-full bg-ajag-verde-700 px-6 py-2.5 text-center text-sm font-medium text-white transition hover:bg-ajag-verde-600"
          >
            Inscribirme
          </Link>
        )}
      </div>

      {hayHorarios || hayClasificacion ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          {hayHorarios ? (
            <Link
              href={`/torneos/${torneo.slug}/salidas`}
              className="flex flex-1 items-center justify-center rounded-2xl border border-ajag-verde-700 px-5 py-3 text-sm font-medium text-ajag-verde-700 transition hover:bg-ajag-verde-50"
            >
              Horarios
            </Link>
          ) : null}
          {hayClasificacion ? (
            <Link
              href={`/torneos/${torneo.slug}/clasificacion`}
              className="flex flex-1 items-center justify-center rounded-2xl border border-ajag-verde-700 px-5 py-3 text-sm font-medium text-ajag-verde-700 transition hover:bg-ajag-verde-50"
            >
              Clasificaciones
            </Link>
          ) : null}
        </div>
      ) : null}
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
