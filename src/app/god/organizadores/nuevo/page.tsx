import type { Metadata } from "next";
import Link from "next/link";
import { OrganizadorForm } from "@/components/god/organizador-form";
import { crearOrganizador } from "../actions";

export const metadata: Metadata = { title: "Nuevo organizador · God Mode" };

export default function NuevoOrganizadorPage() {
  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/god/organizadores" className="text-sm text-ajag-gris-500 hover:underline">
          ← Organizadores
        </Link>
      </div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-aftergolf-verde-900">
        Nuevo organizador
      </h1>
      <OrganizadorForm action={crearOrganizador} textoBoton="Crear organizador" />
    </div>
  );
}
