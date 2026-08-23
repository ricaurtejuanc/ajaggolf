import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LigaForm } from "@/components/admin/liga-form";
import { actualizarLiga } from "../../actions";

export const metadata: Metadata = { title: "Editar liga · Admin" };

export default async function EditarLigaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: liga } = await supabase.from("ligas_pool").select("*").eq("id", id).maybeSingle();
  if (!liga) notFound();

  const accionConId = actualizarLiga.bind(null, id);

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">
          Editar liga
        </h1>
        <Link
          href={`/ligas/${liga.slug}`}
          target="_blank"
          className="text-sm font-medium text-ajag-verde-700 hover:underline"
        >
          Ver página pública ↗
        </Link>
      </div>
      <LigaForm liga={liga} action={accionConId} textoBoton="Guardar cambios" />
    </div>
  );
}
