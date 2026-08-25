"use client";

import { useState } from "react";
import { Download, FileDown, Printer } from "lucide-react";
import type { GrupoVista, JugadorEnGrupoVista } from "./grupos-grid";

export function ExportarSalidasButtons({
  torneoNombre,
  torneoSlug,
  grupos,
  jugadoresPorGrupo,
}: {
  torneoNombre: string;
  torneoSlug: string;
  grupos: GrupoVista[];
  jugadoresPorGrupo: Record<string, JugadorEnGrupoVista[]>;
}) {
  const [exportando, setExportando] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  function filasSalida() {
    return grupos.flatMap((g) =>
      (jugadoresPorGrupo[g.id] ?? []).map((j) => ({
        grupo: g.numeroGrupo,
        hora: g.horaSalida ? g.horaSalida.slice(0, 5) : "",
        hoyo: g.hoyoSalida,
        jugador: j.nombre,
        licencia: j.licenciaFederativa ?? "",
        handicap: j.handicap ?? "",
      })),
    );
  }

  async function exportarXls() {
    setExportando(true);
    try {
      const XLSX = await import("xlsx");
      const filas = filasSalida().map((f) => ({
        Grupo: f.grupo,
        Hora: f.hora,
        Hoyo: f.hoyo,
        Jugador: f.jugador,
        Licencia: f.licencia,
        Hándicap: f.handicap,
      }));
      const hoja = XLSX.utils.json_to_sheet(filas);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Salidas");
      XLSX.writeFile(libro, `salidas-${torneoSlug}.xlsx`);
    } finally {
      setExportando(false);
    }
  }

  async function exportarPdf() {
    setGenerandoPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const filas = filasSalida();

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      const dibujarTitulo = () => {
        doc.setFontSize(13);
        doc.text(`Cuadro de salidas — ${torneoNombre}`, 14, 12);
      };

      // Letra de tamaño fijo y legible siempre: con muchos jugadores, en vez
      // de encogerla hasta hacerla ilegible para caber en una sola hoja, la
      // tabla se reparte en varias páginas (autoTable repite la cabecera; el
      // título se vuelve a dibujar en cada página con didDrawPage).
      autoTable(doc, {
        startY: 18,
        margin: { left: 10, right: 10, top: 16 },
        head: [["Grupo", "Hora", "Hoyo", "Jugador", "Licencia", "Hándicap"]],
        body: filas.map((f) => [f.grupo, f.hora, f.hoyo, f.jugador, f.licencia, f.handicap]),
        styles: { fontSize: 9, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [31, 77, 51] },
        theme: "grid",
        didDrawPage: dibujarTitulo,
      });

      doc.save(`salidas-${torneoSlug}.pdf`);
    } finally {
      setGenerandoPdf(false);
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
        onClick={exportarPdf}
        disabled={generandoPdf || !hayJugadores}
        className="flex items-center gap-2 rounded-full bg-ajag-verde-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:cursor-not-allowed disabled:bg-ajag-gris-200 disabled:text-ajag-gris-500"
      >
        <FileDown size={15} />
        {generandoPdf ? "Generando…" : "Descargar PDF"}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        disabled={!hayJugadores}
        className="flex items-center gap-2 rounded-full border border-ajag-verde-700 px-4 py-2 text-sm font-medium text-ajag-verde-700 transition hover:bg-ajag-verde-50 disabled:cursor-not-allowed disabled:border-ajag-gris-200 disabled:text-ajag-gris-500"
      >
        <Printer size={15} />
        Imprimir
      </button>
    </div>
  );
}
