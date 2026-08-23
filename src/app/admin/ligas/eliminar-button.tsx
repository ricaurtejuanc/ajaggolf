"use client";

import { useTransition } from "react";
import { eliminarLiga } from "./actions";

export function EliminarLigaButton({ ligaId }: { ligaId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          confirm(
            "¿Eliminar esta liga? Los torneos que la tenían asignada dejarán de pertenecer a ella.",
          )
        ) {
          startTransition(() => eliminarLiga(ligaId));
        }
      }}
      className="text-sm font-medium text-ajag-rojo-600 hover:underline disabled:opacity-50"
    >
      Eliminar
    </button>
  );
}
