import type { Metadata } from "next";
import {
  obtenerBizumNumero,
  obtenerCategoriasExtras,
  obtenerDatosPago,
  obtenerWhatsappTelefono,
} from "@/lib/data/configuracion";
import { BizumForm } from "./bizum-form";
import { CategoriasExtrasForm } from "./categorias-extras-form";
import { MetodosPagoForm } from "./metodos-pago-form";
import { WhatsappForm } from "./whatsapp-form";

export const metadata: Metadata = { title: "Configuración · Admin" };

export default async function AdminConfiguracionPage() {
  const [bizumNumero, categoriasExtras, datosPago, whatsappTelefono] = await Promise.all([
    obtenerBizumNumero(),
    obtenerCategoriasExtras(),
    obtenerDatosPago(),
    obtenerWhatsappTelefono(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">Configuración</h1>
      <div className="mt-6 flex flex-col gap-6">
        {datosPago && <MetodosPagoForm
          bizumNumero={datosPago.bizum_numero}
          bizumNombre={datosPago.bizum_nombre}
          transferenciaNumero={datosPago.transferencia_numero}
          transferenciaNombre={datosPago.transferencia_nombre}
        />}
        <BizumForm numeroActual={bizumNumero} />
        <WhatsappForm telefonoActual={whatsappTelefono} />
        <CategoriasExtrasForm categoriasIniciales={categoriasExtras} />
      </div>
    </div>
  );
}
