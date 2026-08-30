"use client";

import { Edit2 } from "lucide-react";
import type { Jugador } from "@/types/database";

interface PerfilViewProps {
  jugador: Jugador;
  onEditClick: () => void;
}

export function PerfilView({ jugador, onEditClick }: PerfilViewProps) {
  return (
    <div className="card-ajag space-y-4 p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-4 flex-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ajag-gris-500">
                Nombre
              </p>
              <p className="mt-1 text-sm font-medium text-ajag-verde-900">{jugador.nombre}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ajag-gris-500">
                Apellidos
              </p>
              <p className="mt-1 text-sm font-medium text-ajag-verde-900">
                {jugador.apellidos || "—"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ajag-gris-500">
                Email de contacto
              </p>
              <p className="mt-1 text-sm text-ajag-verde-900">{jugador.email || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ajag-gris-500">
                Teléfono
              </p>
              <p className="mt-1 text-sm text-ajag-verde-900">{jugador.telefono || "—"}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ajag-gris-500">
                Licencia federativa
              </p>
              <p className="mt-1 text-sm text-ajag-verde-900">
                {jugador.licencia_federativa || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ajag-gris-500">
                Hándicap
              </p>
              <p className="mt-1 text-sm text-ajag-verde-900">
                {jugador.handicap !== null && jugador.handicap !== undefined
                  ? jugador.handicap.toFixed(1)
                  : "—"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ajag-gris-500">
              Sexo
            </p>
            <p className="mt-1 text-sm text-ajag-verde-900 capitalize">
              {jugador.sexo ? (jugador.sexo === "masculino" ? "Masculino" : "Femenino") : "—"}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onEditClick}
        className="mt-6 flex items-center gap-2 rounded-xl border border-ajag-verde-700 px-4 py-2.5 text-sm font-medium text-ajag-verde-700 transition hover:bg-ajag-verde-50"
      >
        <Edit2 size={16} />
        Editar datos
      </button>
    </div>
  );
}
