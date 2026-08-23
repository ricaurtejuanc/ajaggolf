import { createClient } from "@/lib/supabase/server";

export interface InscritoParaResultado {
  inscripcionId: string;
  jugadorId: string;
  nombreCompleto: string;
  licenciaFederativa: string | null;
  handicap: number | null;
}

interface InscripcionConJugadorRaw {
  id: string;
  jugador_id: string;
  licencia_federativa: string | null;
  handicap_snapshot: number | null;
  jugadores: { nombre: string; apellidos: string; handicap: number | null } | null;
}

export async function obtenerInscritosConfirmadosParaResultados(
  torneoId: string,
): Promise<InscritoParaResultado[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inscripciones")
    .select(
      "id, jugador_id, licencia_federativa, handicap_snapshot, jugadores(nombre, apellidos, handicap)",
    )
    .eq("torneo_id", torneoId)
    .eq("estado", "confirmada");

  const filas = (data ?? []) as unknown as InscripcionConJugadorRaw[];

  return filas.map((insc) => ({
    inscripcionId: insc.id,
    jugadorId: insc.jugador_id,
    nombreCompleto: [insc.jugadores?.nombre, insc.jugadores?.apellidos]
      .filter(Boolean)
      .join(" "),
    licenciaFederativa: insc.licencia_federativa,
    handicap: insc.handicap_snapshot ?? insc.jugadores?.handicap ?? null,
  }));
}
