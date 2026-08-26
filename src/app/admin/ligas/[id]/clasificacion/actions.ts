"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { recalcularClasificacionGlobal } from "@/lib/clasificacion/recalcular";
import type { Database } from "@/types/database";

export type EstadoClasificacionLiga = { ok: boolean; error: string | null };

/** Divide un nombre completo en nombre/apellidos (jugadores exige ambos por separado). */
function dividirNombreCompleto(nombreCompleto: string): { nombre: string; apellidos: string } {
  const partes = nombreCompleto.trim().split(/\s+/);
  return { nombre: partes[0] ?? nombreCompleto, apellidos: partes.slice(1).join(" ") };
}

/**
 * Busca un jugador por su licencia federativa (clave natural ya usada en
 * el resto de la app); si no existe se crea como ficha "invitada" (sin
 * cuenta), igual que en la inscripción sin licencia. Si ya existe, se
 * actualiza el nombre con lo escrito aquí para no dejar la ficha
 * desactualizada.
 */
async function resolverJugadorPorLicencia(
  supabase: SupabaseClient<Database>,
  licencia: string,
  nombreCompleto: string,
): Promise<string | null> {
  const { nombre, apellidos } = dividirNombreCompleto(nombreCompleto);

  const { data: existente } = await supabase
    .from("jugadores")
    .select("id")
    .eq("licencia_federativa", licencia)
    .maybeSingle();

  if (existente) {
    await supabase.from("jugadores").update({ nombre, apellidos }).eq("id", existente.id);
    return existente.id;
  }

  const { data: nuevo, error } = await supabase
    .from("jugadores")
    .insert({ nombre, apellidos, licencia_federativa: licencia, user_id: null })
    .select("id")
    .single();
  if (error || !nuevo) return null;
  return nuevo.id;
}

export async function guardarClasificacionLiga(
  ligaId: string,
  _prevState: EstadoClasificacionLiga,
  formData: FormData,
): Promise<EstadoClasificacionLiga> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const nombres = formData.getAll("nombre").map((v) => String(v).trim());
  const licencias = formData.getAll("licencia").map((v) => String(v).trim());
  const puntosTotales = formData.getAll("puntos_totales").map((v) => String(v).trim());
  const eventosJugados = formData.getAll("eventos_jugados").map((v) => String(v).trim());

  const supabase = await createClient();

  const { data: liga } = await supabase
    .from("ligas_pool")
    .select("id, slug")
    .eq("id", ligaId)
    .maybeSingle();
  if (!liga) return { ok: false, error: "Liga no encontrada." };

  const filasValidas = licencias
    .map((licencia, i) => ({
      licencia,
      nombre: nombres[i] || "",
      puntos_totales: puntosTotales[i] ? Number(puntosTotales[i].replace(",", ".")) : 0,
      eventos_jugados: eventosJugados[i] ? parseInt(eventosJugados[i], 10) : 0,
    }))
    .filter((f) => f.licencia && f.nombre);

  if (filasValidas.length === 0) {
    return { ok: false, error: "Añade al menos una fila con nombre y licencia." };
  }

  // clasificacion_global tiene una restricción única (liga_pool_id,
  // jugador_id): si el archivo/tabla trae dos filas con la misma licencia
  // (duplicado accidental), solo se guarda la última para no romper el
  // insert.
  const porJugador = new Map<
    string,
    { jugador_id: string; puntos_totales: number; eventos_jugados: number }
  >();
  for (const fila of filasValidas) {
    const jugadorId = await resolverJugadorPorLicencia(supabase, fila.licencia, fila.nombre);
    if (!jugadorId) continue;
    porJugador.set(jugadorId, {
      jugador_id: jugadorId,
      puntos_totales: fila.puntos_totales,
      eventos_jugados: fila.eventos_jugados,
    });
  }

  if (porJugador.size === 0) {
    return { ok: false, error: "No se ha podido guardar ninguna fila." };
  }

  await supabase.from("clasificacion_global").delete().eq("liga_pool_id", ligaId);

  const filasFinales = Array.from(porJugador.values()).map((f) => ({
    liga_pool_id: ligaId,
    ...f,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("clasificacion_global").insert(filasFinales);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/ligas/${ligaId}/clasificacion`);
  revalidatePath("/clasificaciones");
  revalidatePath(`/clasificaciones/${liga.slug}`);
  return { ok: true, error: null };
}

export async function recalcularClasificacionLiga(ligaId: string): Promise<EstadoClasificacionLiga> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const supabase = await createClient();
  const { data: liga } = await supabase.from("ligas_pool").select("slug").eq("id", ligaId).maybeSingle();
  if (!liga) return { ok: false, error: "Liga no encontrada." };

  await recalcularClasificacionGlobal(ligaId);

  revalidatePath(`/admin/ligas/${ligaId}/clasificacion`);
  revalidatePath("/clasificaciones");
  revalidatePath(`/clasificaciones/${liga.slug}`);
  return { ok: true, error: null };
}
