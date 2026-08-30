"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import { obtenerOrganizadorIdActual } from "@/lib/data/organizador";
import { handicapDeJuego, resultadoDeRonda } from "@/lib/handicap/calculo";

export type EstadoGuardarRonda = { ok: boolean; error: string | null };

/**
 * Guarda una ronda en el historial del jugador.
 *
 * Los resultados (neto, Stableford, differential) se recalculan aquí desde
 * los datos de entrada en vez de aceptar los que manda el navegador: si no,
 * cualquiera podría guardar un differential inventado y ensuciar su propia
 * media. El cliente los calcula solo para enseñarlos al vuelo.
 */
export async function guardarRonda(
  _prevState: EstadoGuardarRonda,
  formData: FormData,
): Promise<EstadoGuardarRonda> {
  const user = await getUsuarioActual();
  if (!user) return { ok: false, error: "Inicia sesión para guardar la ronda." };

  const num = (clave: string) => Number(String(formData.get(clave) ?? "").replace(",", "."));

  const campo = String(formData.get("campo") ?? "").trim();
  if (!campo) return { ok: false, error: "Indica el campo." };

  const cr = num("course_rating");
  const slope = num("slope_rating");
  const par = num("par");
  const handicapIndex = num("handicap_index");
  const bruto = num("bruto");
  const modalidad = num("modalidad") || 1;
  const pcc = num("pcc") || 0;

  if (![cr, slope, par, handicapIndex, bruto].every(Number.isFinite)) {
    return { ok: false, error: "Revisa los datos: hay algún número mal." };
  }
  if (slope < 50 || slope > 155) return { ok: false, error: "El slope no es válido." };
  if (par < 27 || par > 90) return { ok: false, error: "El par no parece válido." };

  const tee = { cr, slope, par };
  const { handicapJuego } = handicapDeJuego({ handicapIndex, tee, modalidad });
  const resultado = resultadoDeRonda({ handicapJuego, bruto, tee, pcc });

  const supabase = await createClient();
  const { error } = await supabase.from("rondas").insert({
    user_id: user.id,
    organizador_id: await obtenerOrganizadorIdActual(),
    fecha: String(formData.get("fecha") ?? "").trim() || undefined,
    campo,
    recorrido: String(formData.get("recorrido") ?? "").trim() || null,
    tee: String(formData.get("tee") ?? "").trim() || null,
    course_rating: cr,
    slope_rating: slope,
    par,
    handicap_index: handicapIndex,
    modalidad,
    handicap_juego: handicapJuego,
    bruto,
    pcc,
    golpes_recibidos: resultado.golpesRecibidos,
    neto: resultado.neto,
    puntos_stableford: resultado.puntosStableford,
    differential: resultado.differential,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/cuenta");
  return { ok: true, error: null };
}

export async function eliminarRonda(rondaId: string) {
  const user = await getUsuarioActual();
  if (!user) return;

  const supabase = await createClient();
  await supabase.from("rondas").delete().eq("id", rondaId);
  revalidatePath("/cuenta");
}
