import { createClient } from "@/lib/supabase/server";
import type { EstadoInscripcion, SexoJugador } from "@/types/database";

export type InscritoDetallado = {
  inscripcionId: string;
  nombreCompleto: string;
  email: string | null;
  telefono: string | null;
  handicap: number | null;
  sexo: SexoJugador | null;
  licenciaFederativa: string | null;
  esSocio: boolean;
  precioCents: number;
  estado: EstadoInscripcion;
  createdAt: string;
};

interface InscripcionDetalladaRaw {
  id: string;
  sexo: SexoJugador | null;
  licencia_federativa: string | null;
  handicap_snapshot: number | null;
  es_socio: boolean;
  precio_cents: number;
  estado: EstadoInscripcion;
  created_at: string;
  jugadores: {
    nombre: string;
    apellidos: string;
    email: string | null;
    telefono: string | null;
    handicap: number | null;
    sexo: SexoJugador | null;
    licencia_federativa: string | null;
  } | null;
}

/**
 * Lista completa de inscritos de un torneo (para el panel de admin), con
 * todos los estados salvo "carrito" (carritos sin terminar no son
 * inscripciones reales). Pensada para verse en tabla y exportarse a XLS.
 */
export async function listarInscritosDetallados(torneoId: string): Promise<InscritoDetallado[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inscripciones")
    .select(
      "id, sexo, licencia_federativa, handicap_snapshot, es_socio, precio_cents, estado, created_at, jugadores(nombre, apellidos, email, telefono, handicap, sexo, licencia_federativa)",
    )
    .eq("torneo_id", torneoId)
    .neq("estado", "carrito")
    .order("created_at", { ascending: true });

  const filas = (data ?? []) as unknown as InscripcionDetalladaRaw[];

  return filas.map((insc) => {
    const jugador = insc.jugadores;
    return {
      inscripcionId: insc.id,
      nombreCompleto: jugador ? `${jugador.nombre} ${jugador.apellidos}`.trim() : "Jugador",
      email: jugador?.email ?? null,
      telefono: jugador?.telefono ?? null,
      handicap: insc.handicap_snapshot ?? jugador?.handicap ?? null,
      sexo: insc.sexo ?? jugador?.sexo ?? null,
      licenciaFederativa: insc.licencia_federativa ?? jugador?.licencia_federativa ?? null,
      esSocio: insc.es_socio,
      precioCents: insc.precio_cents,
      estado: insc.estado,
      createdAt: insc.created_at,
    };
  });
}
