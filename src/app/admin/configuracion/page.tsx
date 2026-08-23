import type { Metadata } from "next";
import { obtenerBizumNumero, obtenerCategoriasExtras } from "@/lib/data/configuracion";
import { BizumForm } from "./bizum-form";
import { CategoriasExtrasForm } from "./categorias-extras-form";

export const metadata: Metadata = { title: "Configuración · Admin" };

export default async function AdminConfiguracionPage() {
  const [bizumNumero, categoriasExtras] = await Promise.all([
    obtenerBizumNumero(),
    obtenerCategoriasExtras(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">Configuración</h1>
      <div className="mt-6 flex flex-col gap-6">
        <BizumForm numeroActual={bizumNumero} />
        <CategoriasExtrasForm categoriasIniciales={categoriasExtras} />
      </div>
    </div>
  );
}
