"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { obtenerOrganizadorIdActual } from "@/lib/data/organizador";

// Marca la inscripción como cancelada (no la borra): el jugador avisó que
// no puede ir. torneos_cupo excluye "cancelada" del recuento, así que la
// plaza queda libre automáticamente sin tocar nada más.
export async function cancelarInscripcion(inscripcionId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  const organizadorIdActual = await obtenerOrganizadorIdActual();

  const { data: inscripcionRaw } = await supabase
    .from("inscripciones")
    .select("torneo_id, torneos(organizador_id)")
    .eq("id", inscripcionId)
    .maybeSingle();
  const inscripcion = inscripcionRaw as unknown as {
    torneo_id: string;
    torneos: { organizador_id: string | null } | null;
  } | null;

  if (
    !inscripcion ||
    (organizadorIdActual && inscripcion.torneos?.organizador_id !== organizadorIdActual)
  ) {
    return;
  }

  await supabase.from("inscripciones").update({ estado: "cancelada" }).eq("id", inscripcionId);

  revalidatePath(`/admin/torneos/${inscripcion.torneo_id}/inscritos`);
}
