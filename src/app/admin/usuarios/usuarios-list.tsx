"use client";

import { useState, useTransition } from "react";
import { eliminarUsuario } from "./actions";
import { formatearFechaCorta } from "@/lib/format";

interface FilaUsuario {
  id: string;
  nombre: string;
  apellidos: string;
  email: string | null;
  telefono: string | null;
  handicap: number | null;
  created_at: string;
}

export function UsuariosList({ usuarios }: { usuarios: FilaUsuario[] }) {
  const [pendienteId, setPendienteId] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [transicionPendiente, startTransition] = useTransition();

  function borrar(usuario: FilaUsuario) {
    if (
      !confirm(
        `¿Eliminar la cuenta de ${usuario.nombre} ${usuario.apellidos}? No podrá volver a iniciar sesión con ella. No se puede deshacer.`,
      )
    ) {
      return;
    }
    setPendienteId(usuario.id);
    setErrores((prev) => ({ ...prev, [usuario.id]: "" }));
    startTransition(async () => {
      const resultado = await eliminarUsuario(usuario.id);
      if (!resultado.ok) {
        setErrores((prev) => ({ ...prev, [usuario.id]: resultado.error ?? "No se pudo eliminar." }));
      }
      setPendienteId(null);
    });
  }

  if (usuarios.length === 0) {
    return <p className="text-sm text-ajag-gris-500">Todavía no hay usuarios registrados con cuenta.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {usuarios.map((u) => (
        <div key={u.id} className="card-ajag flex flex-col gap-1 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ajag-verde-900">
                {u.nombre} {u.apellidos}
              </p>
              <p className="text-xs text-ajag-gris-500">
                {u.email ?? "sin email"}
                {u.telefono ? ` · ${u.telefono}` : ""}
                {u.handicap != null ? ` · hcp ${u.handicap}` : ""} · registrado{" "}
                {formatearFechaCorta(u.created_at.slice(0, 10))}
              </p>
            </div>
            <button
              type="button"
              disabled={transicionPendiente && pendienteId === u.id}
              onClick={() => borrar(u)}
              className="shrink-0 text-sm font-medium text-ajag-rojo-600 hover:underline disabled:opacity-50"
            >
              {transicionPendiente && pendienteId === u.id ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
          {errores[u.id] ? <p className="text-xs text-ajag-rojo-600">{errores[u.id]}</p> : null}
        </div>
      ))}
    </div>
  );
}
