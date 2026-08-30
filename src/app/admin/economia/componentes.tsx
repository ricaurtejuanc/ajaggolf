import { formatearPrecio } from "@/lib/format";
import type { DesgloseCategoria } from "@/lib/data/economia";

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

/** Dato suelto (etiqueta + valor) dentro de un bloque de estadísticas. */
export function Dato({ label, valor, nota }: { label: string; valor: string; nota?: string }) {
  return (
    <div>
      <p className="font-display text-lg font-semibold text-ajag-verde-900">{valor}</p>
      <p className="text-xs text-ajag-gris-500">{label}</p>
      {nota ? <p className="text-xs text-ajag-gris-500">{nota}</p> : null}
    </div>
  );
}

/**
 * Reparto de ingresos o gastos por categoría, con barra proporcional. Se
 * prefiere una barra apilada simple a un gráfico de tarta: con 3-5 categorías
 * se lee igual de rápido, se imprime bien y no arrastra ninguna dependencia.
 */
export function DesgloseCategorias({
  titulo,
  filas,
  variante,
}: {
  titulo: string;
  filas: DesgloseCategoria[];
  variante: "ingreso" | "gasto";
}) {
  const colorBarra = variante === "ingreso" ? "bg-ajag-verde-600" : "bg-ajag-rojo-600";

  return (
    <div className="card-ajag p-5">
      <h3 className="font-display text-base font-semibold text-ajag-verde-900">{titulo}</h3>
      {filas.length === 0 ? (
        <p className="mt-2 text-sm text-ajag-gris-500">Todavía no hay nada registrado.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {filas.map((f) => (
            <li key={f.categoria}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-ajag-verde-900">{f.etiqueta}</span>
                <span className="whitespace-nowrap text-ajag-gris-500">
                  {formatearPrecio(f.importe)} · {f.pct} %
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ajag-gris-100">
                <div className={`h-full ${colorBarra}`} style={{ width: `${f.pct}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
