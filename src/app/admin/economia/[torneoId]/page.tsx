import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerEconomiaTorneo } from "@/lib/data/economia";
import { formatearPrecio, formatearFechaCorta } from "@/lib/format";
import { KpisEconomia, TablaMovimientos } from "../componentes";
import { MovimientoForm } from "../movimiento-form";

export const metadata: Metadata = { title: "Economía del torneo · Admin" };

export default async function AdminEconomiaTorneoPage({
  params,
}: {
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;
  const datos = await obtenerEconomiaTorneo(torneoId);
  if (!datos) notFound();

  const { torneo, resumen, movimientos } = datos;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/economia" className="text-sm text-ajag-gris-500 hover:underline">
          ← Economía
        </Link>
        <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">
          {torneo.nombre}
        </h1>
        <p className="mt-0.5 text-sm text-ajag-gris-500">
          {formatearFechaCorta(torneo.fecha)} ·{" "}
          <Link href={`/admin/torneos/${torneo.id}/inscritos`} className="hover:underline">
            {resumen.inscritosConfirmados} inscritos confirmados
          </Link>
        </p>
      </div>

      <KpisEconomia
        ingresos={resumen.ingresosTotales}
        gastos={resumen.gastos}
        pie={
          resumen.pendienteCobro > 0
            ? `${formatearPrecio(resumen.pendienteCobro)} pendientes de cobro (${resumen.inscritosPendientes} inscripciones sin confirmar el pago).`
            : undefined
        }
      />

      <div className="card-ajag mt-4 flex flex-wrap items-center justify-between gap-2 p-4">
        <div>
          <p className="text-sm font-medium text-ajag-verde-900">
            Inscripciones confirmadas ({resumen.inscritosConfirmados})
          </p>
          <p className="text-xs text-ajag-gris-500">
            Se calcula solo desde las inscripciones, no se puede editar a mano.
          </p>
        </div>
        <p className="font-display text-lg font-semibold text-ajag-verde-700">
          {formatearPrecio(resumen.ingresosInscripciones)}
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <TablaMovimientos
          movimientos={movimientos}
          vacio="Todavía no hay gastos ni ingresos extra en este torneo."
        />
        <MovimientoForm torneoId={torneo.id} fechaSugerida={torneo.fecha} />
      </div>
    </div>
  );
}
