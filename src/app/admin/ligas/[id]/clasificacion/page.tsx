import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClasificacionLigaAdminForm } from "./clasificacion-liga-admin-form";
import { filaVacia, type FilaClasificacion } from "./fila-clasificacion";

export const metadata: Metadata = { title: "Clasificación de liga · Admin" };

export default async function ClasificacionLigaAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: liga } = await supabase
    .from("ligas_pool")
    .select("id, nombre, slug")
    .eq("id", id)
    .maybeSingle();
  if (!liga) notFound();

  const { data: clasificacion } = await supabase
    .from("clasificacion_global")
    .select("jugador_id, puntos_totales, eventos_jugados")
    .eq("liga_pool_id", id)
    .order("puntos_totales", { ascending: false });

  const jugadorIds = (clasificacion ?? []).map((c) => c.jugador_id);
  const { data: jugadores } =
    jugadorIds.length > 0
      ? await supabase
          .from("jugadores")
          .select("id, nombre, apellidos, licencia_federativa")
          .in("id", jugadorIds)
      : { data: [] };
  const jugadorPorId = new Map((jugadores ?? []).map((j) => [j.id, j]));

  const filasIniciales: FilaClasificacion[] = (clasificacion ?? [])
    .map((fila) => {
      const jugador = jugadorPorId.get(fila.jugador_id);
      if (!jugador) return null;
      return filaVacia({
        nombre: jugador.nombre,
        apellidos: jugador.apellidos,
        licenciaFederativa: jugador.licencia_federativa ?? "",
        puntosTotales: String(fila.puntos_totales),
        eventosJugados: String(fila.eventos_jugados),
      });
    })
    .filter((f): f is FilaClasificacion => f != null);

  return (
    <div>
      <Link href="/admin/ligas" className="mb-4 inline-block text-sm text-ajag-gris-500 hover:underline">
        ← Ligas y Pool
      </Link>
      <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">
        Clasificación — {liga.nombre}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ajag-gris-500">
        Esta tabla se recalcula automáticamente desde los resultados publicados de los
        torneos de esta liga cada vez que se guardan o publican. Cualquier edición manual
        que hagas aquí se perderá la próxima vez que se publiquen resultados de un torneo
        de esta liga, salvo que uses &quot;Recalcular desde resultados&quot; después.
      </p>

      <div className="mt-6">
        <ClasificacionLigaAdminForm ligaId={liga.id} filasIniciales={filasIniciales} />
      </div>
    </div>
  );
}
