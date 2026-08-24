"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { InscritoDetallado } from "@/lib/data/inscripciones";

const etiquetaEstado: Record<string, string> = {
  pendiente_pago: "Pendiente de pago",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

export function ExportarXlsButton({
  torneoSlug,
  inscritos,
}: {
  torneoSlug: string;
  inscritos: InscritoDetallado[];
}) {
  const [exportando, setExportando] = useState(false);

  async function exportar() {
    setExportando(true);
    try {
      const XLSX = await import("xlsx");
      const filas = inscritos.map((i) => ({
        Nombre: i.nombreCompleto,
        Email: i.email ?? "",
        Teléfono: i.telefono ?? "",
        Hándicap: i.handicap ?? "",
        Sexo: i.sexo === "masculino" ? "Masculino" : i.sexo === "femenino" ? "Femenino" : "",
        "Licencia federativa": i.licenciaFederativa ?? "",
        Socio: i.esSocio ? "Sí" : "No",
        "Precio (€)": (i.precioCents / 100).toFixed(2),
        Estado: etiquetaEstado[i.estado] ?? i.estado,
        "Fecha inscripción": new Date(i.createdAt).toLocaleString("es-ES"),
      }));
      const hoja = XLSX.utils.json_to_sheet(filas);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Inscritos");
      XLSX.writeFile(libro, `inscritos-${torneoSlug}.xlsx`);
    } finally {
      setExportando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={exportar}
      disabled={exportando || inscritos.length === 0}
      className="flex items-center gap-2 rounded-full bg-ajag-verde-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:cursor-not-allowed disabled:bg-ajag-gris-200 disabled:text-ajag-gris-500"
    >
      <Download size={15} />
      {exportando ? "Generando…" : "Descargar XLS"}
    </button>
  );
}
