import type { Metadata } from "next";
import { listarTorneosPublicos, obtenerEstadoClasificacionPorTorneos } from "@/lib/data/torneos";
import { listarLigasActivas } from "@/lib/data/ligas";
import { ClasificacionesTabs } from "./clasificaciones-tabs";

export const metadata: Metadata = { title: "Clasificaciones" };

export default async function LigasPage() {
  const [torneos, ligas] = await Promise.all([listarTorneosPublicos(), listarLigasActivas()]);
  const estadoClasificacion = await obtenerEstadoClasificacionPorTorneos(torneos);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-ajag-verde-900">
        Clasificaciones
      </h1>
      <p className="mt-2 max-w-2xl text-ajag-gris-500">
        Consulta la clasificación de cada torneo y de cada liga de AJAG,
        incluido el Ranking y el Pool oficiales.
      </p>

      <ClasificacionesTabs
        torneos={torneos}
        estadoClasificacion={estadoClasificacion}
        ligas={ligas}
      />
    </div>
  );
}
