import type { Metadata } from "next";
import { listarTorneosConClasificacion } from "@/lib/data/torneos";
import { obtenerLigaOficial } from "@/lib/data/ligas";
import { createClient } from "@/lib/supabase/server";
import { ClasificacionesTabs } from "./clasificaciones-tabs";
import type { ClasificacionPublica, TipoLigaOficial } from "@/types/database";

export const metadata: Metadata = { title: "Clasificaciones" };

async function obtenerLigaConClasificacion(tipo: TipoLigaOficial) {
  const resultado = await obtenerLigaOficial(tipo);
  if (!resultado) return null;

  const supabase = await createClient();
  const { data: clasificacion } = await supabase
    .from("clasificacion_publica")
    .select("*")
    .eq("liga_pool_id", resultado.liga.id)
    .order("puntos_totales", { ascending: false });

  return { liga: resultado.liga, clasificacion: (clasificacion ?? []) as ClasificacionPublica[] };
}

export default async function LigasPage() {
  const [torneos, ranking, pool] = await Promise.all([
    listarTorneosConClasificacion(),
    obtenerLigaConClasificacion("ranking"),
    obtenerLigaConClasificacion("pool"),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-ajag-verde-900">
        Clasificaciones
      </h1>
      <p className="mt-2 max-w-2xl text-ajag-gris-500">
        Consulta la clasificación de cada torneo, el Ranking general y el
        Pool de AJAG.
      </p>

      <ClasificacionesTabs torneos={torneos} ranking={ranking} pool={pool} />
    </div>
  );
}
