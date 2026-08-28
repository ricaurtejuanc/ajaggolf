"use client";

import { useTransition } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { moverPatrocinador } from "./actions";

export function MoverPatrocinadorBotones({
  patrocinadorId,
  esPrimero,
  esUltimo,
}: {
  patrocinadorId: string;
  esPrimero: boolean;
  esUltimo: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-label="Subir"
        disabled={pending || esPrimero}
        onClick={() => startTransition(() => moverPatrocinador(patrocinadorId, "arriba"))}
        className="flex size-6 items-center justify-center rounded text-ajag-gris-500 hover:bg-ajag-verde-50 hover:text-ajag-verde-700 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronUp size={16} />
      </button>
      <button
        type="button"
        aria-label="Bajar"
        disabled={pending || esUltimo}
        onClick={() => startTransition(() => moverPatrocinador(patrocinadorId, "abajo"))}
        className="flex size-6 items-center justify-center rounded text-ajag-gris-500 hover:bg-ajag-verde-50 hover:text-ajag-verde-700 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronDown size={16} />
      </button>
    </div>
  );
}
