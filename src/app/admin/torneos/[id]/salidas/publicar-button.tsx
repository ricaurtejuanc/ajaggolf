"use client";

import { useTransition } from "react";
import { publicarSalidas, despublicarSalidas } from "./actions";
import type { EstadoSalida } from "@/types/database";

export function PublicarButton({
  torneoId,
  salidaId,
  estado,
}: {
  torneoId: string;
  salidaId: string;
  estado: EstadoSalida;
}) {
  const [pending, startTransition] = useTransition();

  if (estado === "publicado") {
    return (
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-ajag-verde-700 px-3 py-1 text-xs font-medium text-white">
          Publicado
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => despublicarSalidas(torneoId, salidaId))}
          className="text-sm font-medium text-ajag-gris-500 hover:underline disabled:opacity-50"
        >
          Volver a borrador
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => publicarSalidas(torneoId, salidaId))}
      className="rounded-full bg-ajag-verde-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
    >
      {pending ? "Publicando..." : "Publicar cuadro de salidas"}
    </button>
  );
}
