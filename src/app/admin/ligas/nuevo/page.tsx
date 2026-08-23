import type { Metadata } from "next";
import { LigaForm } from "@/components/admin/liga-form";
import { crearLiga } from "../actions";

export const metadata: Metadata = { title: "Nueva liga · Admin" };

export default function NuevaLigaPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-ajag-verde-900">
        Nueva liga / pool
      </h1>
      <LigaForm action={crearLiga} textoBoton="Crear liga" />
    </div>
  );
}
