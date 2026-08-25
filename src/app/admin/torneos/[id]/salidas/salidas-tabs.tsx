"use client";

import { useState, type ReactNode } from "react";
import { FileUp, ListChecks } from "lucide-react";

export function SalidasTabs({
  defaultTab,
  pdfSection,
  generarSection,
}: {
  defaultTab: "pdf" | "generar";
  pdfSection: ReactNode;
  generarSection: ReactNode;
}) {
  const [tab, setTab] = useState<"pdf" | "generar">(defaultTab);

  return (
    <div className="print:hidden">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setTab("pdf")}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition ${
            tab === "pdf"
              ? "bg-ajag-verde-700 text-white"
              : "border border-ajag-gris-200 text-ajag-verde-900 hover:bg-ajag-verde-50"
          }`}
        >
          <FileUp size={16} /> Subir PDF
        </button>
        <button
          type="button"
          onClick={() => setTab("generar")}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition ${
            tab === "generar"
              ? "bg-ajag-verde-700 text-white"
              : "border border-ajag-gris-200 text-ajag-verde-900 hover:bg-ajag-verde-50"
          }`}
        >
          <ListChecks size={16} /> Generar tees
        </button>
      </div>

      <div className="mt-4">{tab === "pdf" ? pdfSection : generarSection}</div>
    </div>
  );
}
