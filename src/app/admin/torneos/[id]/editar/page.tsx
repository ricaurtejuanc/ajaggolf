import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TorneoForm } from "@/components/admin/torneo-form";
import { actualizarTorneo } from "../../actions";

export const metadata: Metadata = { title: "Editar torneo · Admin" };

export default async function EditarTorneoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: torneo }, { data: ligas }] = await Promise.all([
    supabase.from("torneos").select("*").eq("id", id).maybeSingle(),
    supabase.from("ligas_pool").select("*").order("nombre"),
  ]);

  if (!torneo) notFound();

  const accionConId = actualizarTorneo.bind(null, id);

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">
          Editar torneo
        </h1>
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/torneos/${id}/salidas`}
            className="text-sm font-medium text-ajag-verde-700 hover:underline"
          >
            Gestionar salidas →
          </Link>
          <Link
            href={`/torneos/${torneo.slug}`}
            target="_blank"
            className="text-sm font-medium text-ajag-verde-700 hover:underline"
          >
            Ver página pública ↗
          </Link>
        </div>
      </div>
      <TorneoForm
        torneo={torneo}
        ligas={ligas ?? []}
        action={accionConId}
        textoBoton="Guardar cambios"
      />
    </div>
  );
}
