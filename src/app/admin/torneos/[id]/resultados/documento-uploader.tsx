"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { FileUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { subirDocumento } from "./actions";

export function DocumentoUploader({ torneoId }: { torneoId: string }) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendo(true);
    setError(null);

    const supabase = createClient();
    const extension = file.name.split(".").pop() ?? "pdf";
    const esPdf = file.type === "application/pdf" || extension.toLowerCase() === "pdf";
    const path = `${torneoId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("resultados-pdf")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setError("No se pudo subir el archivo.");
      setSubiendo(false);
      return;
    }

    startTransition(async () => {
      const res = await subirDocumento(torneoId, path, file.name, esPdf);
      if (!res.ok) setError(res.error);
      setSubiendo(false);
    });
  }

  return (
    <div>
      <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm font-medium text-ajag-verde-900 hover:bg-ajag-verde-50">
        <FileUp size={16} />
        {subiendo || pending ? "Subiendo..." : "Subir PDF o foto de la clasificación"}
        <input
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          disabled={subiendo || pending}
          onChange={handleFile}
        />
      </label>
      {error ? <p className="mt-1 text-sm text-ajag-rojo-600">{error}</p> : null}
    </div>
  );
}
