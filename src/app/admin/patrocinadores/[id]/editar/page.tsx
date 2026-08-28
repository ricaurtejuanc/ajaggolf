import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { PatrocinadorForm } from "@/components/admin/patrocinador-form";
import { actualizarPatrocinador } from "../../actions";

export const metadata: Metadata = { title: "Editar patrocinador · Admin" };

export default async function EditarPatrocinadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const admin = await getUsuarioAdmin();
  if (!admin?.organizador_id) redirect("/admin/patrocinadores");

  const { data: patrocinador } = await supabase
    .from("patrocinadores")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!patrocinador) notFound();

  const accionConId = actualizarPatrocinador.bind(null, id);

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/admin/patrocinadores" className="text-sm text-ajag-gris-500 hover:underline">
          ← Patrocinadores
        </Link>
      </div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-ajag-verde-900">
        Editar patrocinador
      </h1>
      <PatrocinadorForm
        patrocinador={patrocinador}
        action={accionConId}
        textoBoton="Guardar cambios"
        organizadorId={admin.organizador_id}
      />
    </div>
  );
}
