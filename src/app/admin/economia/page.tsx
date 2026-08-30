import type { Metadata } from "next";
import Link from "next/link";
import { obtenerResumenEconomia } from "@/lib/data/economia";
import { formatearPrecio, formatearFechaCorta } from "@/lib/format";
import { KpisEconomia, TablaMovimientos } from "./componentes";
import { MovimientoForm } from "./movimiento-form";
import { FiltroAnio } from "./filtro-anio";

export const metadata: Metadata = { title: "Economía · Admin" };

export default async function AdminEconomiaPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string }>;
}) {
  const { anio: anioParam } = await searchParams;
  const anio = anioParam && anioParam !== "todos" ? Number(anioParam) : undefined;

  const resumen = await obtenerResumenEconomia(Number.isNaN(anio) ? undefined : anio);
  if (!resumen) {
    return (
      <div className="card-ajag p-8 text-center text-ajag-gris-500">
        No se ha podido cargar la información económica.
      </div>
    );
  }

  const { totales, torneos, generales } = resumen;
  // Server Component: se evalúa una vez por request, no en un re-render.
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">Economía</h1>
          <p className="mt-0.5 text-sm text-ajag-gris-500">
            Ingresos, gastos y beneficio del club, en total y torneo a torneo.
          </p>
        </div>
        <FiltroAnio anios={resumen.anios} anioActual={resumen.anio} />
      </div>

      <KpisEconomia
        ingresos={totales.ingresos}
        gastos={totales.gastos}
        pie={
          totales.pendienteCobro > 0
            ? `${formatearPrecio(totales.pendienteCobro)} pendientes de cobro (inscripciones sin confirmar, todavía no contadas como ingreso) · ${totales.inscritos} inscritos confirmados`
            : `${totales.inscritos} inscritos confirmados`
        }
      />

      <h2 className="mt-8 font-display text-lg font-semibold text-ajag-verde-900">
        Por torneo
      </h2>
      {torneos.length === 0 ? (
        <div className="card-ajag mt-3 p-6 text-center text-sm text-ajag-gris-500">
          No hay torneos en este periodo.
        </div>
      ) : (
        <div className="card-ajag mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-ajag-gris-100 text-xs uppercase tracking-wide text-ajag-gris-500">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Torneo</th>
                <th className="px-4 py-3 text-right font-medium">Inscritos</th>
                <th className="px-4 py-3 text-right font-medium">Ingresos</th>
                <th className="px-4 py-3 text-right font-medium">Gastos</th>
                <th className="px-4 py-3 text-right font-medium">Beneficio</th>
              </tr>
            </thead>
            <tbody>
              {torneos.map((t) => (
                <tr key={t.torneoId} className="border-b border-ajag-gris-100 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-ajag-gris-500">
                    {formatearFechaCorta(t.fecha)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/economia/${t.torneoId}`}
                      className="font-medium text-ajag-verde-900 hover:underline"
                    >
                      {t.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right text-ajag-gris-500">
                    {t.inscritosConfirmados}
                  </td>
                  <td className="px-4 py-3 text-right text-ajag-gris-500">
                    {formatearPrecio(t.ingresosTotales)}
                  </td>
                  <td className="px-4 py-3 text-right text-ajag-gris-500">
                    {formatearPrecio(t.gastos)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                      t.beneficio >= 0 ? "text-ajag-verde-700" : "text-ajag-rojo-600"
                    }`}
                  >
                    {formatearPrecio(t.beneficio)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-8 font-display text-lg font-semibold text-ajag-verde-900">
        Movimientos generales
      </h2>
      <p className="mt-0.5 text-sm text-ajag-gris-500">
        Ingresos y gastos del club que no pertenecen a ningún torneo concreto: cuotas, seguros,
        material común… Para lo de un torneo, entra en su ficha desde la tabla de arriba.
      </p>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <TablaMovimientos
          movimientos={generales.movimientos}
          vacio="Todavía no hay movimientos generales."
        />
        <MovimientoForm fechaSugerida={hoy} />
      </div>
    </div>
  );
}
