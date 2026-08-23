import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Flag, Coins, Users } from "lucide-react";
import { obtenerTorneoPorSlug } from "@/lib/data/torneos";
import { createClient } from "@/lib/supabase/server";
import { formatearFecha, formatearHora, formatearPrecio } from "@/lib/format";

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
    .from("inscripciones")
    .select("id", { count: "exact", head: true })
    .eq("torneo_id", torneo.id)
    .in("estado", ["pendiente_pago", "confirmada"]);

  const [{ data: liga }, { count: inscritos }] = await Promise.all([ligaPromise, cupoPromise]);

  const cerrado = torneo.estado !== "publicado";
  const lleno =
    torneo.cupo_maximo != null && (inscritos ?? 0) >= torneo.cupo_maximo;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-ajag-verde-100">
        {torneo.poster_url ? (
          <Image
            src={torneo.poster_url}
            alt={torneo.nombre}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ajag-verde-700/50">
            <CalendarDays size={56} />
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-1">
        {liga ? (
          <Link
            href={`/ligas/${liga.slug}`}
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

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <InfoPill icon={<MapPin size={16} />} label="Campo" value={torneo.campo_golf} />
        <InfoPill
          icon={<Flag size={16} />}
          label="Tees"
          value={torneo.tees.length ? torneo.tees.join(", ") : "Por confirmar"}
        />
        <InfoPill
          icon={<CalendarDays size={16} />}
          label="Hora"
          value={formatearHora(torneo.hora_inicio) ?? "Por confirmar"}
        />
        <InfoPill
          icon={<Coins size={16} />}
          label="Precio"
          value={formatearPrecio(torneo.precio_cents)}
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

      <div className="mt-8 flex items-center justify-between rounded-2xl border border-ajag-gris-100 bg-white p-5">
        <div>
          <p className="font-display text-lg font-semibold text-ajag-verde-900">
            {formatearPrecio(torneo.precio_cents)}
          </p>
          <p className="flex items-center gap-1 text-xs text-ajag-gris-500">
            <Users size={13} />
            {inscritos ?? 0}
            {torneo.cupo_maximo ? ` / ${torneo.cupo_maximo}` : ""} inscritos
          </p>
        </div>

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

      <p className="mt-8">
        <span className="text-xs uppercase tracking-wide text-ajag-gris-500">Formato</span>
        <br />
        <span className="text-sm font-medium text-ajag-verde-900">
          {etiquetaFormato[torneo.formato_puntuacion]}
        </span>
      </p>
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
