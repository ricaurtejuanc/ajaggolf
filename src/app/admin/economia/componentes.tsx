import { formatearPrecio, formatearFechaCorta } from "@/lib/format";
import { etiquetaCategoria } from "@/lib/economia/categorias";
import { EliminarMovimientoButton } from "./eliminar-movimiento-button";
import type { MovimientoEconomico } from "@/types/database";

/** Fila de indicadores: ingresos, gastos, beneficio y margen. */
export function KpisEconomia({
  ingresos,
  gastos,
  pie,
}: {
  ingresos: number;
  gastos: number;
  /** Texto pequeño bajo el bloque (p. ej. pendiente de cobro). */
  pie?: string;
}) {
  const beneficio = ingresos - gastos;
  // Sin ingresos no hay margen que calcular (dividir por 0 daría Infinity o
  // NaN y se pintaría un "—" mucho más honesto).
  const margen = ingresos > 0 ? Math.round((beneficio / ingresos) * 100) : null;

  const tarjetas = [
    { label: "Ingresos", valor: formatearPrecio(ingresos), clase: "text-ajag-verde-900" },
    { label: "Gastos", valor: formatearPrecio(gastos), clase: "text-ajag-rojo-600" },
    {
      label: "Beneficio",
      valor: formatearPrecio(beneficio),
      clase: beneficio >= 0 ? "text-ajag-verde-700" : "text-ajag-rojo-600",
    },
    {
      label: "Margen",
      valor: margen === null ? "—" : `${margen} %`,
      clase: "text-ajag-verde-900",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tarjetas.map((t) => (
          <div key={t.label} className="card-ajag p-4">
            <p className={`font-display text-xl font-semibold ${t.clase}`}>{t.valor}</p>
            <p className="mt-1 text-xs text-ajag-gris-500">{t.label}</p>
          </div>
        ))}
      </div>
      {pie ? <p className="mt-2 text-xs text-ajag-gris-500">{pie}</p> : null}
    </div>
  );
}

/** Tabla de movimientos manuales, con su borrado. */
export function TablaMovimientos({
  movimientos,
  vacio,
}: {
  movimientos: MovimientoEconomico[];
  vacio: string;
}) {
  if (movimientos.length === 0) {
    return <div className="card-ajag p-6 text-center text-sm text-ajag-gris-500">{vacio}</div>;
  }

  return (
    <div className="card-ajag overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-ajag-gris-100 text-xs uppercase tracking-wide text-ajag-gris-500">
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Concepto</th>
            <th className="px-4 py-3 font-medium">Categoría</th>
            <th className="px-4 py-3 text-right font-medium">Importe</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {movimientos.map((m) => (
            <tr key={m.id} className="border-b border-ajag-gris-100 last:border-0">
              <td className="px-4 py-3 whitespace-nowrap text-ajag-gris-500">
                {formatearFechaCorta(m.fecha)}
              </td>
              <td className="px-4 py-3 font-medium text-ajag-verde-900">
                {m.concepto}
                {m.notas ? (
                  <span className="block text-xs font-normal text-ajag-gris-500">{m.notas}</span>
                ) : null}
              </td>
              <td className="px-4 py-3 text-ajag-gris-500">
                {etiquetaCategoria(m.tipo, m.categoria)}
              </td>
              <td
                className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                  m.tipo === "ingreso" ? "text-ajag-verde-700" : "text-ajag-rojo-600"
                }`}
              >
                {m.tipo === "ingreso" ? "+" : "−"} {formatearPrecio(m.importe_cents)}
              </td>
              <td className="px-4 py-3 text-right">
                <EliminarMovimientoButton movimientoId={m.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
