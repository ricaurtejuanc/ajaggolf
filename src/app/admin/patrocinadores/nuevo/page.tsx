import type { Metadata } from "next";
import { PatrocinadorForm } from "@/components/admin/patrocinador-form";
import { crearPatrocinador } from "../actions";

export const metadata: Metadata = { title: "Nuevo patrocinador · Admin" };

export default function NuevoPatrocinadorPage() {
  return (
    <div className="max-w-lg">
      <h1 className="mb-6 font-display text-2xl font-semibold text-ajag-verde-900">
        Nuevo patrocinador
      </h1>
      <PatrocinadorForm action={crearPatrocinador} textoBoton="Crear patrocinador" />
    </div>
  );
}
