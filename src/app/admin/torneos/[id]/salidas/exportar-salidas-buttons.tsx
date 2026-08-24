"use client";

import { useState } from "react";
import { Download, Printer } from "lucide-react";
import type { GrupoVista, JugadorEnGrupoVista } from "./grupos-grid";

export function ExportarSalidasButtons({
  torneoSlug,
  grupos,
  jugadoresPorGrupo,
}: {
  torneoSlug: string;
  grupos: GrupoVista[];
  jugadoresPorGrupo: Record<string, JugadorEnGrupoVista[]>;
}) {
  const [exportando, setExportando] = useState(false);

  async function exportarXls() {
    setExportando(true);
    try {
      const XLSX = await import("xlsx");
      const filas = grupos.flatMap((g) =>
        (jugadoresPorGrupo[g.id] ?? []).map((j) => ({
          Grupo: g.numeroGrupo,
          Hora: g.horaSalida ? g.horaSalida.slice(0, 5) : "",
          Hoyo: g.hoyoSalida,
          Jugador: j.nombre,
          Hándicap: j.handicap ?? "",
        })),
      );
      const hoja = XLSX.utils.json_to_sheet(filas);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Salidas");
      XLSX.writeFile(libro, `salidas-${torneoSlug}.xlsx`);
    } finally {
      setExportando(false);
    }
  }

  const hayJugadores = grupos.some((g) => (jugadoresPorGrupo[g.id] ?? []).length > 0);

  return (
    <div className="mb-4 flex flex-wrap gap-2 print:hidden">
      <button
        type="button"
        onClick={exportarXls}
        disabled={exportando || !hayJugadores}
        className="flex items-center gap-2 rounded-full bg-ajag-verde-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:cursor-not-allowed disabled:bg-ajag-gris-200 disabled:text-ajag-gris-500"
      >
        <Download size={15} />
        {exportando ? "Generando…" : "Descargar XLS"}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        disabled={!hayJugadores}
        className="flex items-center gap-2 rounded-full border border-ajag-verde-700 px-4 py-2 text-sm font-medium text-ajag-verde-700 transition hover:bg-ajag-verde-50 disabled:cursor-not-allowed disabled:border-ajag-gris-200 disabled:text-ajag-gris-500"
      >
        <Printer size={15} />
        Imprimir / PDF
      </button>
    </div>
  );
}
