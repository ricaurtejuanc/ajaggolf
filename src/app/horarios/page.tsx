import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { listarTorneosPublicos, obtenerIdsConSalidaPublicada } from "@/lib/data/torneos";
import { formatearFecha } from "@/lib/format";
import type { Torneo } from "@/types/database";

export const metadata: Metadata = { title: "Horarios" };

export default async function HorariosPage() {
  const torneos = await listarTorneosPublicos();
  const idsConSalida = await obtenerIdsConSalidaPublicada(torneos.map((t) => t.id));

  const activos = torneos.filter((t) => t.estado === "publicado");
  // Los disputados van de fecha más reciente a más antigua (más cerca de hoy primero).
  const disputados = torneos
    .filter((t) => t.estado !== "publicado")
    .slice()
    .reverse();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-ajag-verde-900">Horarios</h1>
      <p className="mt-2 max-w-2xl text-ajag-gris-500">
        Consulta los horarios y cuadros de salida de cada torneo de AJAG.
      </p>

      {torneos.length === 0 ? (
        <div className="card-ajag mt-8 p-8 text-center text-ajag-gris-500">
          Todavía no hay torneos publicados.
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          {activos.length > 0 ? (
            <div>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-ajag-gris-500">
                Activos
              </h2>
              <ListaHorarios torneos={activos} idsConSalida={idsConSalida} />
            </div>
          ) : null}
          {disputados.length > 0 ? (
            <div>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-ajag-gris-500">
                Disputados
              </h2>
              <ListaHorarios torneos={disputados} idsConSalida={idsConSalida} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ListaHorarios({
  torneos,
  idsConSalida,
}: {
  torneos: Torneo[];
  idsConSalida: Set<string>;
}) {
  return (
    <div className="flex flex-col gap-3">
      {torneos.map((torneo) => {
        const tieneSalida = idsConSalida.has(torneo.id);
        const tienePdf = Boolean(torneo.horarios_pdf_url);
        const disponible = tieneSalida || tienePdf;
        const href = tieneSalida
          ? `/torneos/${torneo.slug}/salidas`
          : (torneo.horarios_pdf_url ?? "");

        const contenido = (
          <>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ajag-oro-600">
                {formatearFecha(torneo.fecha)}
              </p>
              <p className="font-display font-semibold text-ajag-verde-900">{torneo.nombre}</p>
              {!disponible ? (
                <p className="mt-0.5 text-xs text-ajag-gris-500">Aún no disponible</p>
              ) : null}
            </div>
            <CalendarDays
              size={18}
              className={`shrink-0 ${disponible ? "text-ajag-verde-700" : "text-ajag-gris-200"}`}
            />
          </>
        );

        return disponible ? (
          <a
            key={torneo.id}
            href={href}
            target={tienePdf && !tieneSalida ? "_blank" : undefined}
            rel={tienePdf && !tieneSalida ? "noreferrer" : undefined}
            className="card-ajag flex items-center justify-between gap-3 p-4 transition hover:shadow-md"
          >
            {contenido}
          </a>
        ) : (
          <div
            key={torneo.id}
            className="card-ajag flex items-center justify-between gap-3 p-4 opacity-60"
          >
            {contenido}
          </div>
        );
      })}
    </div>
  );
}
