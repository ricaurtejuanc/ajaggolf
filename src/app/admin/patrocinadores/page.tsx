import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listarPatrocinadores } from "@/lib/data/patrocinadores";
import { EliminarPatrocinadorButton } from "./eliminar-button";

export const metadata: Metadata = { title: "Patrocinadores · Admin" };

export default async function AdminPatrocinadoresPage() {
  const patrocinadores = await listarPatrocinadores();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">
          Patrocinadores
        </h1>
        <Link
          href="/admin/patrocinadores/nuevo"
          className="rounded-full bg-ajag-verde-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-ajag-verde-600"
        >
          + Nuevo patrocinador
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {patrocinadores.length === 0 ? (
          <p className="text-sm text-ajag-gris-500">Todavía no hay patrocinadores dados de alta.</p>
        ) : (
          patrocinadores.map((patrocinador) => (
            <div key={patrocinador.id} className="card-ajag flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ajag-gris-100 bg-white">
                  <Image
                    src={patrocinador.logo_url}
                    alt={patrocinador.nombre}
                    fill
                    unoptimized
                    className="object-contain p-1.5"
                    sizes="56px"
                  />
                </div>
                <div>
                  <p className="font-medium text-ajag-verde-900">{patrocinador.nombre}</p>
                  <p className="text-xs text-ajag-gris-500">
                    {patrocinador.web ?? patrocinador.telefono ?? "Sin web ni teléfono"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/patrocinadores/${patrocinador.id}/editar`}
                  className="text-sm font-medium text-ajag-verde-700 hover:underline"
                >
                  Editar
                </Link>
                <EliminarPatrocinadorButton patrocinadorId={patrocinador.id} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
