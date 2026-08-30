"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { FileText, FileUp, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { actualizarHorariosPdf } from "./actions";

export function HorariosPdfUploader({
  torneoId,
  pdfUrlInicial,
}: {
  torneoId: string;
  pdfUrlInicial: string | null;
}) {
  const [pdfUrl, setPdfUrl] = useState(pdfUrlInicial);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Se limpia siempre: si no, volver a elegir el mismo archivo (tras un
    // error, o para reemplazar el actual) no dispara el change.
    e.target.value = "";
    if (!file) return;

    setSubiendo(true);
    setError(null);

    const supabase = createClient();
    const esPdf = file.type === "application/pdf";
    const extension = esPdf ? "pdf" : (file.name.split(".").pop() ?? "jpg");
    const path = `${torneoId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("horarios")
      .upload(path, file, { upsert: false, contentType: file.type || undefined });

    if (uploadError) {
      setError("No se pudo subir el archivo.");
      setSubiendo(false);
      return;
    }

    const { data } = supabase.storage.from("horarios").getPublicUrl(path);

    startTransition(async () => {
      const res = await actualizarHorariosPdf(torneoId, data.publicUrl);
      if (!res.ok) {
        setError(res.error);
      } else {
        setPdfUrl(data.publicUrl);
      }
      setSubiendo(false);
    });
  }

  function quitar() {
    setError(null);
    startTransition(async () => {
      const res = await actualizarHorariosPdf(torneoId, null);
      if (!res.ok) setError(res.error);
      else setPdfUrl(null);
    });
  }

  return (
    <div className="card-ajag p-5">
      <h2 className="mb-1 font-display text-base font-semibold text-ajag-verde-900">
        Horarios en PDF o foto
      </h2>
      <p className="mb-3 text-sm text-ajag-gris-500">
        Si el club manda el cuadro de horarios en PDF o en una foto en vez de generarlo aquí
        arriba, súbelo y se mostrará en la ficha pública del torneo.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {pdfUrl ? (
          <>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm font-medium text-ajag-verde-900 hover:bg-ajag-verde-50"
            >
              <FileText size={16} /> Ver archivo actual
            </a>
            <button
              type="button"
              onClick={quitar}
              disabled={pending}
              aria-label="Quitar archivo"
              className="flex size-9 items-center justify-center rounded-xl text-ajag-rojo-600 hover:bg-ajag-rojo-50 disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </>
        ) : null}
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm font-medium text-ajag-verde-900 hover:bg-ajag-verde-50">
          <FileUp size={16} />
          {subiendo || pending ? "Subiendo..." : pdfUrl ? "Cambiar PDF o foto" : "Subir PDF o foto"}
          <input
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            disabled={subiendo || pending}
            onChange={handleFile}
          />
        </label>
      </div>
      {error ? <p className="mt-2 text-sm text-ajag-rojo-600">{error}</p> : null}
    </div>
  );
}
