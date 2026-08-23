import type { Metadata } from "next";
import { obtenerBizumNumero } from "@/lib/data/configuracion";
import { BizumForm } from "./bizum-form";

export const metadata: Metadata = { title: "Configuración · Admin" };

export default async function AdminConfiguracionPage() {
  const bizumNumero = await obtenerBizumNumero();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">Configuración</h1>
      <div className="mt-6">
        <BizumForm numeroActual={bizumNumero} />
      </div>
    </div>
  );
}
