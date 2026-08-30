"use client";

import { useTransition } from "react";
import { eliminarMovimiento } from "./actions";

export function EliminarMovimientoButton({ movimientoId }: { movimientoId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("¿Eliminar este movimiento?")) {
          startTransition(() => eliminarMovimiento(movimientoId));
        }
      }}
      className="text-sm font-medium text-ajag-rojo-600 hover:underline disabled:opacity-50"
    >
      Eliminar
    </button>
  );
}
