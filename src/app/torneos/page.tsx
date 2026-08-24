import type { Metadata } from "next";
import {
  listarTorneosPublicos,
  obtenerInscritosPorTorneo,
  obtenerEstadoClasificacionPorTorneos,
  obtenerIdsConSalidaPublicada,
} from "@/lib/data/torneos";
import { createClient } from "@/lib/supabase/server";
import { TorneoCard } from "@/components/torneos/torneo-card";
import { TorneoDisputadoBanner } from "@/components/torneos/torneo-disputado-banner";
import type { Torneo } from "@/types/database";

export const metadata: Metadata = { title: "Calendario de torneos" };

function agruparPorMes(torneos: Torneo[]) {
  const grupos = new Map<string, { etiqueta: string; torneos: Torneo[] }>();
  for (const torneo of torneos) {
    const fecha = new Date(`${torneo.fecha}T00:00:00`);
    const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
    const etiqueta = fecha.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });
    if (!grupos.has(clave)) {
      grupos.set(clave, {
        etiqueta: etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1),
        torneos: [],
      });
    }
    grupos.get(clave)!.torneos.push(torneo);
  }
  return [...grupos.values()];
}

export default async function TorneosPage() {
  const torneos = await listarTorneosPublicos();
  const proximos = torneos.filter((t) => t.estado === "publicado");
  // Los disputados van de más reciente a más antiguo (orden inverso al de
  // "próximos"), agrupados por mes igual que los próximos.
  const pasados = torneos
    .filter((t) => t.estado !== "publicado")
    .slice()
    .reverse();
  const proximosPorMes = agruparPorMes(proximos);
  const pasadosPorMes = agruparPorMes(pasados);

  const supabase = await createClient();
  const [inscritosPorTorneo, estadoClasificacion, idsConSalida] = await Promise.all([
    obtenerInscritosPorTorneo(
      supabase,
      proximos.map((t) => t.id),
    ),
    obtenerEstadoClasificacionPorTorneos(pasados),
    obtenerIdsConSalidaPublicada(pasados.map((t) => t.id)),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-ajag-verde-900">
        Calendario de torneos
      </h1>
      <p className="mt-2 max-w-2xl text-ajag-gris-500">
        Consulta los próximos torneos de AJAG e inscríbete online. El pago se
        confirma por Bizum en unas pocas horas.
      </p>

      {torneos.length === 0 ? (
        <div className="card-ajag mt-8 p-8 text-center text-ajag-gris-500">
          Todavía no hay torneos publicados. Vuelve pronto.
        </div>
      ) : (
        <>
          {proximosPorMes.length > 0 ? (
            <div className="mt-8 flex flex-col gap-10">
              {proximosPorMes.map((grupo) => (
                <div key={grupo.etiqueta}>
                  <h2 className="mb-4 font-display text-xl font-semibold text-ajag-verde-900">
                    {grupo.etiqueta}
                  </h2>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {grupo.torneos.map((torneo) => (
                      <TorneoCard
                        key={torneo.id}
                        torneo={torneo}
                        inscritos={inscritosPorTorneo[torneo.id] ?? 0}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {pasadosPorMes.length > 0 ? (
            <div className="mt-12">
              <h2 className="mb-4 font-display text-xl font-semibold text-ajag-verde-900">
                Torneos disputados
              </h2>
              <div className="flex flex-col gap-8">
                {pasadosPorMes.map((grupo) => (
                  <div key={grupo.etiqueta}>
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-ajag-gris-500">
                      {grupo.etiqueta}
                    </h3>
                    <div className="flex flex-col gap-4">
                      {grupo.torneos.map((torneo) => {
                        const tieneSalida = idsConSalida.has(torneo.id);
                        return (
                          <TorneoDisputadoBanner
                            key={torneo.id}
                            torneo={torneo}
                            horariosDisponible={tieneSalida || Boolean(torneo.horarios_pdf_url)}
                            horariosHref={
                              tieneSalida
                                ? `/torneos/${torneo.slug}/salidas`
                                : torneo.horarios_pdf_url
                            }
                            clasificacionDisponible={
                              estadoClasificacion[torneo.id]?.disponible ?? false
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
