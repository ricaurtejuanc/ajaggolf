import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CamposList } from "./campos-list";

export const metadata: Metadata = { title: "Campos de golf · Admin" };

export default async function CamposPage() {
  const supabase = await createClient();
  const { data: campos } = await supabase
    .from("campos_golf")
    .select("id, nombre, recorrido")
    .order("nombre")
    .order("recorrido");

  const clubes = new Map<string, { id: string; recorrido: string }[]>();
  for (const c of campos ?? []) {
    const lista = clubes.get(c.nombre) ?? [];
    lista.push({ id: c.id, recorrido: c.recorrido });
    clubes.set(c.nombre, lista);
  }
  const clubesOrdenados = Array.from(clubes.entries())
    .map(([nombre, recorridos]) => ({ nombre, recorridos }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-semibold text-ajag-verde-900">
        Campos de golf
      </h1>
      <p className="mb-6 text-sm text-ajag-gris-500">
        Catálogo compartido que se usa para sugerir campo y recorrido al crear un torneo.
        Cambiarlo aquí no modifica los torneos que ya usan un nombre/recorrido — solo afecta a
        las sugerencias a partir de ahora.
      </p>
      <CamposList clubes={clubesOrdenados} />
    </div>
  );
}
