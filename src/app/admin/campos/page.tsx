import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { CamposList, type TeeVista } from "./campos-list";

export const metadata: Metadata = { title: "Campos de golf · Admin" };

export default async function CamposPage() {
  const [supabaseClient, admin] = await Promise.all([createClient(), getUsuarioAdmin()]);
  const [{ data: campos }, { data: tees }] = await Promise.all([
    supabaseClient
      .from("campos_golf")
      .select("id, nombre, recorrido")
      .order("nombre")
      .order("recorrido"),
    supabaseClient
      .from("campo_tees")
      .select("id, club_nombre, recorrido, tee, genero, cr, slope, par")
      .order("tee")
      .limit(2000),
  ]);

  // Las valoraciones viven en su propia tabla y se enlazan por nombre de club
  // y recorrido, que es como vinieron del catálogo de la federación.
  const teesPorRecorrido = new Map<string, TeeVista[]>();
  for (const t of tees ?? []) {
    const clave = `${t.club_nombre}\u0000${t.recorrido}`;
    const lista = teesPorRecorrido.get(clave) ?? [];
    lista.push({
      id: t.id,
      tee: t.tee,
      genero: t.genero as "H" | "M",
      cr: Number(t.cr),
      slope: t.slope,
      par: t.par,
    });
    teesPorRecorrido.set(clave, lista);
  }

  const clubes = new Map<string, { id: string; recorrido: string; tees: TeeVista[] }[]>();
  for (const c of campos ?? []) {
    const lista = clubes.get(c.nombre) ?? [];
    lista.push({
      id: c.id,
      recorrido: c.recorrido,
      tees: teesPorRecorrido.get(`${c.nombre}\u0000${c.recorrido}`) ?? [],
    });
    clubes.set(c.nombre, lista);
  }
  const clubesOrdenados = Array.from(clubes.entries())
    .map(([nombre, recorridos]) => ({ nombre, recorridos }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const esOwner = admin?.rol === "owner";

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-semibold text-ajag-verde-900">
        Campos de golf
      </h1>
      <p className="mb-6 text-sm text-ajag-gris-500">
        Catálogo compartido que se usa para sugerir campo y recorrido al crear un torneo, y
        cuyas valoraciones (CR y slope de cada barra) alimentan la calculadora de hándicap.
        Cambiar un nombre aquí no modifica los torneos que ya lo usan — solo afecta a las
        sugerencias a partir de ahora.
      </p>
      <CamposList clubes={clubesOrdenados} esOwner={esOwner} />
    </div>
  );
}
