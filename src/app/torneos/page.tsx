import type { Metadata } from "next";
import { listarTorneosPublicos, obtenerInscritosPorTorneo } from "@/lib/data/torneos";
import { createClient } from "@/lib/supabase/server";
import { TorneoCard } from "@/components/torneos/torneo-card";
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
  const pasados = torneos.filter((t) => t.estado !== "publicado");
  const proximosPorMes = agruparPorMes(proximos);

  const supabase = await createClient();
  const inscritosPorTorneo = await obtenerInscritosPorTorneo(
    supabase,
    proximos.map((t) => t.id),
  );

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

          {pasados.length > 0 ? (
            <div className="mt-12">
              <h2 className="mb-4 font-display text-xl font-semibold text-ajag-verde-900">
                Torneos disputados
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {pasados.map((torneo) => (
                  <TorneoCard key={torneo.id} torneo={torneo} />
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
