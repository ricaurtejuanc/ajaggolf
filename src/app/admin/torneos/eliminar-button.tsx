"use client";

import { useTransition } from "react";
import { eliminarTorneo } from "./actions";

export function EliminarTorneoButton({ torneoId }: { torneoId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("¿Eliminar este torneo? Esta acción no se puede deshacer.")) {
          startTransition(() => eliminarTorneo(torneoId));
        }
      }}
      className="text-sm font-medium text-ajag-rojo-600 hover:underline disabled:opacity-50"
    >
      Eliminar
    </button>
  );
}
