"use client";

import { useRouter } from "next/navigation";

/** Selector de año: navega a /admin/economia?anio=... al cambiar. */
export function FiltroAnio({
  anios,
  anioActual,
}: {
  anios: number[];
  anioActual: number | null;
}) {
  const router = useRouter();
  if (anios.length === 0) return null;

  return (
    <label className="flex items-center gap-2 text-sm text-ajag-gris-500">
      Periodo
      <select
        value={anioActual ?? "todos"}
        onChange={(e) => router.push(`/admin/economia?anio=${e.target.value}`)}
        className="rounded-xl border border-ajag-gris-200 bg-white px-3 py-2 text-sm text-ajag-verde-900 outline-none focus:border-ajag-verde-600"
      >
        <option value="todos">Todo el histórico</option>
        {anios.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </label>
  );
}
