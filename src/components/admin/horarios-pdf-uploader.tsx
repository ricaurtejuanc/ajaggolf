"use client";

import { useState, type ChangeEvent } from "react";
import { FileText, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function HorariosPdfUploader({ pdfUrlInicial }: { pdfUrlInicial?: string | null }) {
  const [pdfUrl, setPdfUrl] = useState(pdfUrlInicial ?? null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendo(true);
    setError(null);

    const supabase = createClient();
    const path = `${crypto.randomUUID()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("horarios")
      .upload(path, file, { upsert: false, contentType: "application/pdf" });

    if (uploadError) {
      setError("No se pudo subir el PDF.");
      setSubiendo(false);
      return;
    }

    const { data } = supabase.storage.from("horarios").getPublicUrl(path);
    setPdfUrl(data.publicUrl);
    setSubiendo(false);
  }

  return (
    <div>
      <span className="text-sm font-medium text-ajag-verde-900">Horarios en PDF</span>
      <p className="mt-1 text-xs text-ajag-gris-500">
        Si el club manda el cuadro de horarios en PDF en vez de generarlo aquí, súbelo y se
        mostrará en la ficha pública del torneo.
      </p>
      <input type="hidden" name="horarios_pdf_url" value={pdfUrl ?? ""} />

      <div className="mt-2 flex items-center gap-3">
        {pdfUrl ? (
          <>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm font-medium text-ajag-verde-900 hover:bg-ajag-verde-50"
            >
              <FileText size={16} /> Ver PDF actual
            </a>
            <button
              type="button"
              onClick={() => setPdfUrl(null)}
              aria-label="Quitar PDF"
              className="flex size-9 items-center justify-center rounded-xl text-ajag-rojo-600 hover:bg-ajag-rojo-50"
            >
              <X size={16} />
            </button>
          </>
        ) : null}
        <label className="cursor-pointer rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm font-medium text-ajag-verde-900 hover:bg-ajag-verde-50">
          {subiendo ? "Subiendo..." : pdfUrl ? "Cambiar PDF" : "Subir PDF"}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={subiendo}
            onChange={handleFile}
          />
        </label>
      </div>
      {error ? <p className="mt-1 text-sm text-ajag-rojo-600">{error}</p> : null}
    </div>
  );
}
