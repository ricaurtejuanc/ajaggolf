import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TorneoForm } from "@/components/admin/torneo-form";
import { crearTorneo } from "../actions";

export const metadata: Metadata = { title: "Nuevo torneo · Admin" };

export default async function NuevoTorneoPage() {
  const supabase = await createClient();
  const { data: ligas } = await supabase.from("ligas_pool").select("*").order("nombre");

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-ajag-verde-900">
        Nuevo torneo
      </h1>
      <TorneoForm ligas={ligas ?? []} action={crearTorneo} textoBoton="Crear torneo" />
    </div>
  );
}
