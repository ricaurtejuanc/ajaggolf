"use client";

import { useTransition } from "react";
import { eliminarPatrocinador } from "./actions";

export function EliminarPatrocinadorButton({ patrocinadorId }: { patrocinadorId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("¿Eliminar este patrocinador?")) {
          startTransition(() => eliminarPatrocinador(patrocinadorId));
        }
      }}
      className="text-sm font-medium text-ajag-rojo-600 hover:underline disabled:opacity-50"
    >
      Eliminar
    </button>
  );
}
