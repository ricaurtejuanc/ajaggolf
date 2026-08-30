"use client";

import { useTransition } from "react";
import { cancelarInscripcion } from "./actions";

export function CancelarInscripcionButton({ inscripcionId }: { inscripcionId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("¿Cancelar la inscripción de este jugador? Liberará su plaza.")) {
          startTransition(() => cancelarInscripcion(inscripcionId));
        }
      }}
      className="rounded-full px-3 py-1 text-xs font-medium text-ajag-gris-500 transition hover:bg-ajag-rojo-600/10 hover:text-ajag-rojo-600 disabled:opacity-50"
    >
      Cancelar
    </button>
  );
}
