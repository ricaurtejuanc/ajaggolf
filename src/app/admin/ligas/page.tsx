import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EliminarLigaButton } from "./eliminar-button";

export const metadata: Metadata = { title: "Ligas y Pool · Admin" };

export default async function AdminLigasPage() {
  const supabase = await createClient();
  const { data: ligas } = await supabase
    .from("ligas_pool")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">
          Ligas y Pool
        </h1>
        <Link
          href="/admin/ligas/nuevo"
          className="rounded-full bg-ajag-verde-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-ajag-verde-600"
        >
          + Nueva liga
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {(ligas ?? []).length === 0 ? (
          <p className="text-sm text-ajag-gris-500">Todavía no hay ligas creadas.</p>
        ) : (
          (ligas ?? []).map((liga) => (
            <div key={liga.id} className="card-ajag flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-ajag-verde-900">
                  {liga.nombre}
                  {liga.tipo_oficial ? (
                    <span className="ml-2 rounded-full bg-ajag-oro-500/20 px-2 py-0.5 text-xs text-ajag-oro-600">
                      {liga.tipo_oficial === "ranking" ? "Ranking oficial" : "Pool oficial"}
                    </span>
                  ) : null}
                  {!liga.activa ? (
                    <span className="ml-2 rounded-full bg-ajag-gris-100 px-2 py-0.5 text-xs text-ajag-gris-500">
                      inactiva
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-ajag-gris-500">
                  {liga.temporada ?? "Sin temporada"} · {Object.keys(liga.tabla_puntos).length}{" "}
                  posiciones puntúan
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/ligas/${liga.id}/editar`}
                  className="text-sm font-medium text-ajag-verde-700 hover:underline"
                >
                  Editar
                </Link>
                <EliminarLigaButton ligaId={liga.id} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
