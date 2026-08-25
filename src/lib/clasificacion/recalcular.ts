import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Recalcula la clasificación global de una liga/pool desde cero: suma los
 * puntos por posición (según la tabla_puntos de la liga) de todos los
 * resultados publicados de los torneos que pertenecen a esa liga.
 *
 * Se ejecuta cada vez que se publican (o despublican) resultados de un
 * torneo con liga_pool_id asignada.
 */
export async function recalcularClasificacionGlobal(ligaId: string): Promise<void> {
  const supabase = await createClient();

  const { data: liga } = await supabase
    .from("ligas_pool")
    .select("tabla_puntos, modo_puntuacion")
    .eq("id", ligaId)
    .maybeSingle();
  if (!liga) return;

  const tablaPuntos = liga.tabla_puntos as Record<string, number>;
  const sumaStableford = liga.modo_puntuacion === "suma_stableford";

  const { data: torneos } = await supabase
    .from("torneos")
    .select("id")
    .eq("liga_pool_id", ligaId);
  const torneoIds = (torneos ?? []).map((t) => t.id);

  await supabase.from("clasificacion_global").delete().eq("liga_pool_id", ligaId);

  if (torneoIds.length === 0) return;

  const { data: resultados } = await supabase
    .from("resultados")
    .select("jugador_id, torneo_id, posicion, puntos")
    .in("torneo_id", torneoIds)
    .eq("estado", "publicado")
    .not("jugador_id", "is", null);

  const acumulado = new Map<string, { puntos: number; torneos: Set<string> }>();

  for (const r of resultados ?? []) {
    if (!r.jugador_id) continue;
    // Una fila sin puntuación real (posición o puntos sin rellenar: jugador
    // inscrito pero sin resultado, retirado, no presentado...) no cuenta
    // como participación en la liga: no debe sumar puestos con 0 puntos.
    let puntos: number;
    if (sumaStableford) {
      if (r.puntos == null) continue;
      puntos = r.puntos;
    } else {
      if (r.posicion == null) continue;
      puntos = tablaPuntos[String(r.posicion)] ?? tablaPuntos.resto ?? 0;
    }
    const entrada = acumulado.get(r.jugador_id) ?? { puntos: 0, torneos: new Set<string>() };
    entrada.puntos += puntos;
    entrada.torneos.add(r.torneo_id);
    acumulado.set(r.jugador_id, entrada);
  }

  if (acumulado.size === 0) return;

  const filas = Array.from(acumulado.entries()).map(([jugador_id, v]) => ({
    liga_pool_id: ligaId,
    jugador_id,
    puntos_totales: v.puntos,
    eventos_jugados: v.torneos.size,
    updated_at: new Date().toISOString(),
  }));

  await supabase.from("clasificacion_global").insert(filas);
}
