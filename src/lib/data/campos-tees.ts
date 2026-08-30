import "server-only";
import { createClient } from "@/lib/supabase/server";

export type TeeCatalogo = {
  id: string;
  club: string;
  recorrido: string;
  tee: string;
  genero: "H" | "M";
  cr: number;
  slope: number;
  par: number;
};

/**
 * Catálogo completo de valoraciones (565 tees). Se manda entero al cliente
 * en vez de buscar contra el servidor a cada tecla: son ~60 KB, se cargan
 * una vez y a partir de ahí el filtrado por campo y barra es instantáneo y
 * funciona aunque se caiga la conexión en el campo, que es justo donde se
 * usa esto.
 */
export async function listarTeesCatalogo(): Promise<TeeCatalogo[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campo_tees")
    .select("id, club_nombre, recorrido, tee, genero, cr, slope, par")
    .order("club_nombre")
    .order("recorrido")
    .limit(2000);

  return (data ?? []).map((t) => ({
    id: t.id,
    club: t.club_nombre,
    recorrido: t.recorrido,
    tee: t.tee,
    genero: t.genero as "H" | "M",
    cr: Number(t.cr),
    slope: t.slope,
    par: t.par,
  }));
}
