import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizadorForm } from "@/components/god/organizador-form";
import { actualizarOrganizador } from "../../actions";

export const metadata: Metadata = { title: "Editar organizador · God Mode" };

export default async function EditarOrganizadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: organizador } = await supabase
    .from("organizadores")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!organizador) notFound();

  const accionConId = actualizarOrganizador.bind(null, id);

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 font-display text-2xl font-semibold text-ajag-verde-900">
        Editar organizador
      </h1>
      <OrganizadorForm
        organizador={organizador}
        action={accionConId}
        textoBoton="Guardar cambios"
      />
    </div>
  );
}
