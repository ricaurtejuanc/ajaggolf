import Image from "next/image";
import Link from "next/link";
import { MapPin, CalendarDays } from "lucide-react";
import { formatearFecha, formatearPrecio } from "@/lib/format";
import type { Torneo } from "@/types/database";

const etiquetaFormato: Record<Torneo["formato_puntuacion"], string> = {
  stableford: "Stableford",
  medal_play: "Medal Play",
};

const etiquetaEstado: Record<Torneo["estado"], string> = {
  borrador: "Borrador",
  publicado: "Inscripciones abiertas",
  cerrado: "Inscripciones cerradas",
  finalizado: "Finalizado",
};

export function TorneoCard({ torneo }: { torneo: Torneo }) {
  return (
    <Link
      href={`/torneos/${torneo.slug}`}
      className="card-ajag group flex flex-col overflow-hidden transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ajag-verde-100">
        {torneo.poster_url ? (
          <Image
            src={torneo.poster_url}
            alt={torneo.nombre}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(min-width: 768px) 33vw, 100vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ajag-verde-700/50">
            <CalendarDays size={40} />
          </div>
        )}
        <span
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-medium ${
            torneo.estado === "publicado"
              ? "bg-ajag-verde-700 text-white"
              : "bg-white/90 text-ajag-gris-500"
          }`}
        >
          {etiquetaEstado[torneo.estado]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-ajag-oro-600">
          {formatearFecha(torneo.fecha)}
        </p>
        <h3 className="font-display text-lg font-semibold text-ajag-verde-900">
          {torneo.nombre}
        </h3>
        <p className="flex items-center gap-1.5 text-sm text-ajag-gris-500">
          <MapPin size={15} /> {torneo.campo_golf}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="rounded-full bg-ajag-verde-50 px-2.5 py-1 text-xs font-medium text-ajag-verde-700">
            {etiquetaFormato[torneo.formato_puntuacion]}
          </span>
          <span className="font-display text-base font-semibold text-ajag-verde-900">
            {torneo.precio_socio_cents != null
              ? `Desde ${formatearPrecio(Math.max(torneo.precio_socio_cents, torneo.precio_cents))}`
              : formatearPrecio(torneo.precio_cents)}
          </span>
        </div>
      </div>
    </Link>
  );
}
