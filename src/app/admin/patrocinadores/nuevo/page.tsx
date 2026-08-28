import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioAdmin } from "@/lib/auth";
import { PatrocinadorForm } from "@/components/admin/patrocinador-form";
import { crearPatrocinador } from "../actions";

export const metadata: Metadata = { title: "Nuevo patrocinador · Admin" };

export default async function NuevoPatrocinadorPage() {
  const admin = await getUsuarioAdmin();
  if (!admin?.organizador_id) redirect("/admin/patrocinadores");

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/admin/patrocinadores" className="text-sm text-ajag-gris-500 hover:underline">
          ← Patrocinadores
        </Link>
      </div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-ajag-verde-900">
        Nuevo patrocinador
      </h1>
      <PatrocinadorForm action={crearPatrocinador} textoBoton="Crear patrocinador" organizadorId={admin.organizador_id} />
    </div>
  );
}
