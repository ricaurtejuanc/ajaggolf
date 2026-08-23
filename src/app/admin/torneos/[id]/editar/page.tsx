import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TorneoForm } from "@/components/admin/torneo-form";
import { listarCamposGolf } from "@/lib/data/campos-golf";
import { obtenerCategoriasExtras } from "@/lib/data/configuracion";
import { actualizarTorneo } from "../../actions";

export const metadata: Metadata = { title: "Editar torneo · Admin" };

export default async function EditarTorneoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: torneo }, { data: ligas }, camposGolf, categoriasExtras] = await Promise.all([
    supabase.from("torneos").select("*").eq("id", id).maybeSingle(),
    supabase.from("ligas_pool").select("*").order("nombre"),
    listarCamposGolf(),
    obtenerCategoriasExtras(),
  ]);

  if (!torneo) notFound();

  const accionConId = actualizarTorneo.bind(null, id);

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">
          Editar torneo
        </h1>
        <Link
          href={`/torneos/${torneo.slug}`}
          target="_blank"
          className="text-sm font-medium text-ajag-verde-700 hover:underline"
        >
          Ver página pública ↗
        </Link>
      </div>
      <TorneoForm
        torneo={torneo}
        ligas={ligas ?? []}
        camposGolf={camposGolf}
        categoriasExtras={categoriasExtras}
        action={accionConId}
        textoBoton="Guardar cambios"
      />
    </div>
  );
}
