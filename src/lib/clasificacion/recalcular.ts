import "server-only";
import { createClient } from "@/lib/supabase/server";
import { calcularPuntosPorTorneo, esMenorMejor, sumarMejores } from "./puntuacion";

/**
 * Recalcula la clasificación global de una liga/pool desde cero: suma los
 * puntos (según el modo_puntuacion de la liga) de todos los resultados
 * publicados de los torneos que pertenecen a esa liga. Si la liga limita la
 * puntuación final a los X mejores resultados (mejores_n_torneos), solo se
 * suman esos X por jugador; el resto de torneos jugados igualmente cuentan
 * para "eventos_jugados" (es informativo, no afecta a la puntuación).
 *
 * Se ejecuta cada vez que se publican (o despublican) resultados de un
 * torneo con liga_pool_id asignada.
 */
export async function recalcularClasificacionGlobal(ligaId: string): Promise<void> {
  const supabase = await createClient();

  const { data: liga } = await supabase
    .from("ligas_pool")
    .select("tabla_puntos, modo_puntuacion, mejores_n_torneos")
    .eq("id", ligaId)
    .maybeSingle();
  if (!liga) return;

  const tablaPuntos = liga.tabla_puntos as Record<string, number>;
  const modoPuntuacion = liga.modo_puntuacion as
    | "tabla_puntos"
    | "suma_stableford"
    | "suma_medal_handicap";
  const menorMejor = esMenorMejor(modoPuntuacion);

  const { data: torneos } = await supabase
    .from("torneos")
    .select("id")
    .eq("liga_pool_id", ligaId);
  const torneoIds = (torneos ?? []).map((t) => t.id);

  await supabase.from("clasificacion_global").delete().eq("liga_pool_id", ligaId);

  if (torneoIds.length === 0) return;

  const { data: resultados } = await supabase
    .from("resultados")
    .select("jugador_id, torneo_id, posicion, puntos, golpes, handicap")
    .in("torneo_id", torneoIds)
    .eq("estado", "publicado")
    .not("jugador_id", "is", null);

  const valoresPorJugador = new Map<string, number[]>();
  const torneosPorJugador = new Map<string, Set<string>>();

  for (const r of resultados ?? []) {
    if (!r.jugador_id) continue;
    // Una fila sin puntuación real (posición, puntos o golpes sin rellenar:
    // jugador inscrito pero sin resultado, retirado, no presentado...) no
    // cuenta como participación en la liga.
    const valor = calcularPuntosPorTorneo(modoPuntuacion, tablaPuntos, r);
    if (valor == null) continue;

    (valoresPorJugador.get(r.jugador_id) ?? valoresPorJugador.set(r.jugador_id, []).get(r.jugador_id)!).push(
      valor,
    );
    (torneosPorJugador.get(r.jugador_id) ?? torneosPorJugador.set(r.jugador_id, new Set()).get(r.jugador_id)!).add(
      r.torneo_id,
    );
  }

  if (valoresPorJugador.size === 0) return;

  const filas = Array.from(valoresPorJugador.entries()).map(([jugador_id, valores]) => ({
    liga_pool_id: ligaId,
    jugador_id,
    puntos_totales: sumarMejores(valores, liga.mejores_n_torneos, menorMejor),
    eventos_jugados: torneosPorJugador.get(jugador_id)?.size ?? valores.length,
    updated_at: new Date().toISOString(),
  }));

  await supabase.from("clasificacion_global").insert(filas);
}
