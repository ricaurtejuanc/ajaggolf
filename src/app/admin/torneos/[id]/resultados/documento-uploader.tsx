"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { FileUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  CATEGORIAS_CLASIFICACION_PDF,
  etiquetaCategoriaClasificacion,
} from "@/lib/resultados/categorias";
import type { CategoriaClasificacionPdf } from "@/types/database";
import { subirDocumento } from "./actions";

export function DocumentoUploader({
  torneoId,
  categoriasSubidas,
}: {
  torneoId: string;
  categoriasSubidas: CategoriaClasificacionPdf[];
}) {
  const [categoria, setCategoria] = useState<CategoriaClasificacionPdf | "">("");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // El input se limpia siempre: si no, volver a elegir el mismo archivo
    // (tras un error, o para otra categoría) no dispara el change.
    e.target.value = "";
    if (!file) return;
    if (!categoria) {
      setError("Elige primero la categoría de la clasificación.");
      return;
    }

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
      const res = await subirDocumento(torneoId, path, file.name, esPdf, categoria);
      if (res.ok) setCategoria("");
      else setError(res.error);
      setSubiendo(false);
    });
  }

  const ocupado = subiendo || pending;

  return (
    <div className="card-ajag p-4">
      <p className="text-sm font-medium text-ajag-verde-900">Subir clasificación</p>
      <p className="mt-1 text-sm text-ajag-gris-500">
        Elige la categoría del documento y después el PDF o la foto. Puedes subir uno por
        categoría; los jugadores las cambian con un selector.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ajag-verde-900">
          Categoría
          <select
            value={categoria}
            disabled={ocupado}
            onChange={(e) => {
              setCategoria(e.target.value as CategoriaClasificacionPdf | "");
              setError(null);
            }}
            className="rounded-xl border border-ajag-gris-200 px-3 py-2 text-sm text-ajag-verde-900 disabled:opacity-50"
          >
            <option value="">Selecciona una categoría…</option>
            {CATEGORIAS_CLASIFICACION_PDF.map((c) => (
              <option key={c} value={c}>
                {etiquetaCategoriaClasificacion[c]}
                {categoriasSubidas.includes(c) ? " (ya subida)" : ""}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={ocupado || !categoria}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm font-medium text-ajag-verde-900 transition hover:bg-ajag-verde-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileUp size={16} />
          {ocupado ? "Subiendo..." : "Subir PDF o foto de la clasificación"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          disabled={ocupado}
          onChange={handleFile}
        />
      </div>

      {!categoria && !error ? (
        <p className="mt-2 text-xs text-ajag-gris-500">
          Selecciona la categoría para poder subir el archivo.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-ajag-rojo-600">{error}</p> : null}
    </div>
  );
}
