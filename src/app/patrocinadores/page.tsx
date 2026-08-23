import type { Metadata } from "next";
import { listarPatrocinadores } from "@/lib/data/patrocinadores";
import { PatrocinadorTile } from "@/components/patrocinadores/patrocinador-tile";

export const metadata: Metadata = { title: "Patrocinadores" };

export default async function PatrocinadoresPage() {
  const patrocinadores = await listarPatrocinadores();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-ajag-verde-900">
        Patrocinadores
      </h1>
      <p className="mt-2 max-w-2xl text-ajag-gris-500">
        Gracias a las empresas que hacen posible AJAG Golf.
      </p>

      {patrocinadores.length === 0 ? (
        <p className="mt-8 text-sm text-ajag-gris-500">Todavía no hay patrocinadores.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {patrocinadores.map((patrocinador) => (
            <PatrocinadorTile key={patrocinador.id} patrocinador={patrocinador} />
          ))}
        </div>
      )}
    </div>
  );
}
