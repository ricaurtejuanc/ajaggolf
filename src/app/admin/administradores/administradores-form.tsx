"use client";

import { useActionState, useTransition } from "react";
import {
  cambiarActivoAdministrador,
  crearAdministrador,
  eliminarAdministrador,
  type EstadoAltaAdmin,
} from "./actions";
import { formatearFechaCorta } from "@/lib/format";
import type { UsuarioAdmin } from "@/types/database";

export function AdministradoresForm({
  administradores,
  miId,
}: {
  administradores: UsuarioAdmin[];
  miId: string;
}) {
  const [state, formAction, pending] = useActionState<EstadoAltaAdmin, FormData>(
    crearAdministrador,
    { ok: false, error: null },
  );
  const [transicionPendiente, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="card-ajag flex flex-col gap-4 p-5">
        <h2 className="font-display text-base font-semibold text-ajag-verde-900">
          Añadir administrador
        </h2>
        <p className="text-xs text-ajag-gris-500">
          La persona tiene que haber iniciado sesión al menos una vez en la web (con Google o
          el enlace por email) antes de poder añadirla aquí.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nombre" className="text-sm font-medium text-ajag-verde-900">
              Nombre *
            </label>
            <input
              id="nombre"
              name="nombre"
              required
              className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
            />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-ajag-verde-900">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
            />
          </div>
        </div>

        {state.error ? <p className="text-sm text-ajag-rojo-600">{state.error}</p> : null}
        {state.ok ? (
          <p className="text-sm text-ajag-verde-700">Administrador añadido correctamente.</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-xl bg-ajag-verde-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
        >
          {pending ? "Añadiendo..." : "Añadir"}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {administradores.map((a) => (
          <div key={a.id} className="card-ajag flex items-center justify-between gap-3 p-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-ajag-verde-900">
                {a.nombre}
                {a.id === miId ? (
                  <span className="rounded-full bg-ajag-verde-50 px-2 py-0.5 text-xs font-medium text-ajag-verde-700">
                    Tú
                  </span>
                ) : null}
                {!a.activo ? (
                  <span className="rounded-full bg-ajag-gris-100 px-2 py-0.5 text-xs font-medium text-ajag-gris-500">
                    Desactivado
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-ajag-gris-500">
                {a.email} · admin desde {formatearFechaCorta(a.created_at.slice(0, 10))}
              </p>
            </div>

            {a.id === miId ? null : (
              <div className="flex shrink-0 gap-3">
                <button
                  type="button"
                  disabled={transicionPendiente}
                  onClick={() =>
                    startTransition(() => cambiarActivoAdministrador(a.id, !a.activo))
                  }
                  className="text-sm font-medium text-ajag-verde-700 hover:underline disabled:opacity-50"
                >
                  {a.activo ? "Desactivar" : "Reactivar"}
                </button>
                <button
                  type="button"
                  disabled={transicionPendiente}
                  onClick={() => {
                    if (confirm(`¿Quitar a ${a.nombre} como administrador? No se puede deshacer.`)) {
                      startTransition(() => eliminarAdministrador(a.id));
                    }
                  }}
                  className="text-sm font-medium text-ajag-rojo-600 hover:underline disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
