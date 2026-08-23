"use client";

import { useTransition } from "react";
import { marcarConsultaLeida } from "./actions";
import { formatearFechaCorta } from "@/lib/format";
import type { ConsultaContacto } from "@/types/database";

export function ConsultaCard({ consulta }: { consulta: ConsultaContacto }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className={`card-ajag p-5 ${consulta.leido ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-ajag-verde-900">{consulta.nombre}</p>
          <p className="text-sm text-ajag-gris-500">
            {consulta.email}
            {consulta.telefono ? ` · ${consulta.telefono}` : ""}
          </p>
        </div>
        <span className="text-xs text-ajag-gris-500">
          {formatearFechaCorta(consulta.created_at.slice(0, 10))}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-line text-sm text-ajag-verde-900">{consulta.mensaje}</p>

      {!consulta.leido ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => marcarConsultaLeida(consulta.id))}
          className="mt-3 text-sm font-medium text-ajag-verde-700 hover:underline disabled:opacity-50"
        >
          Marcar como leída
        </button>
      ) : null}
    </div>
  );
}
