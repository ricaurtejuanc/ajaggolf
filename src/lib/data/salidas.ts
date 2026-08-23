import { createClient } from "@/lib/supabase/server";
import type { JugadorParaSalida } from "@/lib/salidas/generar";

interface InscripcionConJugadorRaw {
  id: string;
  licencia_federativa: string | null;
  handicap_snapshot: number | null;
  juega_con_licencias: string[];
  jugador_id: string;
  jugadores: {
    nombre: string;
    apellidos: string;
    handicap: number | null;
    sexo: string | null;
    licencia_federativa: string | null;
  } | null;
}

export async function obtenerJugadoresConfirmados(
  torneoId: string,
): Promise<JugadorParaSalida[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inscripciones")
    .select(
      "id, licencia_federativa, handicap_snapshot, juega_con_licencias, jugador_id, jugadores(nombre, apellidos, handicap, sexo, licencia_federativa)",
    )
    .eq("torneo_id", torneoId)
    .eq("estado", "confirmada");

  const filas = (data ?? []) as unknown as InscripcionConJugadorRaw[];

  return filas.map((insc) => {
    const jugador = insc.jugadores;
    return {
      inscripcionId: insc.id,
      jugadorId: insc.jugador_id,
      nombre: jugador ? `${jugador.nombre} ${jugador.apellidos}`.trim() : "Jugador",
      handicap: insc.handicap_snapshot ?? jugador?.handicap ?? null,
      sexo: jugador?.sexo ?? null,
      licenciaFederativa: insc.licencia_federativa ?? jugador?.licencia_federativa ?? null,
      juegaConLicencias: insc.juega_con_licencias ?? [],
    };
  });
}
