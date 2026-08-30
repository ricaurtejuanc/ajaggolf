"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PerfilForm } from "./perfil-form";
import { PerfilView } from "./perfil-view";
import type { Jugador } from "@/types/database";

interface PerfilEditorProps {
  jugador: Jugador;
}

export function PerfilEditor({ jugador }: PerfilEditorProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      {!isEditing ? (
        <PerfilView jugador={jugador} onEditClick={() => setIsEditing(true)} />
      ) : (
        <div className="card-ajag p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-ajag-verde-900">
              Editar datos personales
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-lg p-2 text-ajag-gris-500 transition hover:bg-ajag-gris-100"
            >
              <X size={20} />
            </button>
          </div>
          <PerfilForm jugador={jugador} onCancelEdit={() => setIsEditing(false)} />
        </div>
      )}
    </>
  );
}
