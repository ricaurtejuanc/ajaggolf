import type { Metadata } from "next";
import { listarTorneosPublicos } from "@/lib/data/torneos";
import { TorneoCard } from "@/components/torneos/torneo-card";

export const metadata: Metadata = { title: "Calendario de torneos" };

export default async function TorneosPage() {
  const torneos = await listarTorneosPublicos();
  const proximos = torneos.filter((t) => t.estado === "publicado");
  const pasados = torneos.filter((t) => t.estado !== "publicado");

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
          {proximos.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {proximos.map((torneo) => (
                <TorneoCard key={torneo.id} torneo={torneo} />
              ))}
            </div>
          ) : null}

          {pasados.length > 0 ? (
            <div className="mt-12">
              <h2 className="mb-4 font-display text-xl font-semibold text-ajag-verde-900">
                Torneos anteriores
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
