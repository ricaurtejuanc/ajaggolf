"use client";

import { useTransition } from "react";
import { FileText, Eye } from "lucide-react";
import { publicarDocumento, despublicarDocumento } from "./actions";
import { createClient } from "@/lib/supabase/client";
import type { EstadoPdfResultados } from "@/types/database";

const etiquetaEstado: Record<EstadoPdfResultados, { texto: string; clase: string }> = {
  preview: { texto: "Sin publicar", clase: "bg-ajag-gris-100 text-ajag-gris-500" },
  publicado: { texto: "Publicado", clase: "bg-ajag-verde-700 text-white" },
  descartado: { texto: "Descartado", clase: "bg-ajag-rojo-600/10 text-ajag-rojo-600" },
};

export function DocumentoActual({
  torneoId,
  documento,
}: {
  torneoId: string;
  documento: { id: string; nombre_archivo: string; storage_path: string; estado: EstadoPdfResultados };
}) {
  const [pending, startTransition] = useTransition();
  const supabase = createClient();
  const { data } = supabase.storage.from("resultados-pdf").getPublicUrl(documento.storage_path);
  const estado = etiquetaEstado[documento.estado];

  return (
    <div className="card-ajag mb-6 flex items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-2 text-sm text-ajag-verde-900">
        <FileText size={16} />
        <span>{documento.nombre_archivo}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${estado.clase}`}>
          {estado.texto}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <a
          href={data.publicUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-sm font-medium text-ajag-verde-700 hover:underline"
        >
          <Eye size={15} /> Ver
        </a>
        {documento.estado === "publicado" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => despublicarDocumento(torneoId, documento.id))}
            className="text-sm font-medium text-ajag-gris-500 hover:underline disabled:opacity-50"
          >
            Despublicar
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => publicarDocumento(torneoId, documento.id))}
            className="rounded-full bg-ajag-verde-700 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-50"
          >
            Publicar documento
          </button>
        )}
      </div>
    </div>
  );
}
