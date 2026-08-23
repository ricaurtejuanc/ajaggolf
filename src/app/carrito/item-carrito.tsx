"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { quitarDelCarrito } from "./actions";
import { formatearPrecio, formatearFecha } from "@/lib/format";
import type { ItemCarrito } from "@/lib/data/carrito";

export function ItemCarritoRow({ item }: { item: ItemCarrito }) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="font-medium text-ajag-verde-900">{item.torneos?.nombre}</p>
        {item.torneos ? (
          <p className="text-sm text-ajag-gris-500">{formatearFecha(item.torneos.fecha)}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-medium text-ajag-verde-900">
          {formatearPrecio(item.precio_cents)}
        </span>
        <button
          type="button"
          aria-label="Quitar del carrito"
          disabled={pending}
          onClick={() => startTransition(() => quitarDelCarrito(item.id))}
          className="text-ajag-gris-500 hover:text-ajag-rojo-600 disabled:opacity-50"
        >
          <X size={18} />
        </button>
      </div>
    </li>
  );
}
