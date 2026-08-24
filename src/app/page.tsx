import Link from "next/link";
import { listarProximosTorneos, obtenerInscritosPorTorneo } from "@/lib/data/torneos";
import { createClient } from "@/lib/supabase/server";
import { TorneoCard } from "@/components/torneos/torneo-card";

export default async function Home() {
  const proximos = await listarProximosTorneos(3);
  const supabase = await createClient();
  const inscritosPorTorneo = await obtenerInscritosPorTorneo(
    supabase,
    proximos.map((t) => t.id),
  );

  return (
    <div>
      <section className="bg-ajag-hero px-4 py-10 text-white sm:py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center">
          <h1 className="font-display max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
            Torneos amateur de golf, sin complicaciones
          </h1>
          <p className="max-w-xl text-white/85">
            Calendario, inscripciones, salidas y clasificaciones de la
            Asociación de Jugadores Amateur de Golf.
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-3">
            <Link
              href="/torneos"
              className="rounded-full bg-ajag-oro-500 px-6 py-3 text-sm font-semibold text-ajag-verde-950 transition hover:bg-ajag-oro-600"
            >
              Ver calendario
            </Link>
            <Link
              href="/ligas"
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Clasificaciones
            </Link>
            <Link
              href="/horarios"
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Horarios
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-ajag-verde-900">
            Próximos torneos
          </h2>
          <Link href="/torneos" className="text-sm font-medium text-ajag-verde-700 hover:underline">
            Ver todos
          </Link>
        </div>

        {proximos.length === 0 ? (
          <p className="mt-6 text-ajag-gris-500">
            No hay torneos publicados por ahora. Vuelve pronto o consulta{" "}
            <Link href="/contacto" className="underline">
              contacto
            </Link>
            .
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {proximos.map((torneo) => (
              <TorneoCard
                key={torneo.id}
                torneo={torneo}
                inscritos={inscritosPorTorneo[torneo.id] ?? 0}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
