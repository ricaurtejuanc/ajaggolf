"use client";

import { useActionState } from "react";
import { actualizarPerfil } from "./actions";
import type { Jugador } from "@/types/database";

export function PerfilForm({ jugador }: { jugador: Jugador }) {
  const [state, formAction, pending] = useActionState(actualizarPerfil, {
    ok: false,
    error: null,
  });

  return (
    <form action={formAction} className="card-ajag flex flex-col gap-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nombre" className="text-sm font-medium text-ajag-verde-900">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            defaultValue={jugador.nombre}
            required
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          />
        </div>
        <div>
          <label htmlFor="apellidos" className="text-sm font-medium text-ajag-verde-900">
            Apellidos
          </label>
          <input
            id="apellidos"
            name="apellidos"
            defaultValue={jugador.apellidos}
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-ajag-verde-900">
            Email de contacto
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={jugador.email ?? ""}
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          />
        </div>
        <div>
          <label htmlFor="telefono" className="text-sm font-medium text-ajag-verde-900">
            Teléfono
          </label>
          <input
            id="telefono"
            name="telefono"
            defaultValue={jugador.telefono ?? ""}
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="licencia_federativa" className="text-sm font-medium text-ajag-verde-900">
            Licencia federativa
          </label>
          <input
            id="licencia_federativa"
            name="licencia_federativa"
            defaultValue={jugador.licencia_federativa ?? ""}
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          />
        </div>
        <div>
          <label htmlFor="handicap" className="text-sm font-medium text-ajag-verde-900">
            Hándicap
          </label>
          <input
            id="handicap"
            name="handicap"
            type="number"
            step="0.1"
            placeholder="Ej. 18.4"
            defaultValue={jugador.handicap ?? ""}
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          />
          <p className="mt-1 text-xs text-ajag-gris-500">
            Se usa para agrupar automáticamente las salidas por nivel.
          </p>
        </div>
      </div>

      <div>
        <span className="text-sm font-medium text-ajag-verde-900">Sexo</span>
        <div className="mt-1 flex gap-4">
          {(["masculino", "femenino"] as const).map((valor) => (
            <label key={valor} className="flex items-center gap-2 text-sm text-ajag-gris-500">
              <input
                type="radio"
                name="sexo"
                value={valor}
                defaultChecked={jugador.sexo === valor}
              />
              {valor === "masculino" ? "Masculino" : "Femenino"}
            </label>
          ))}
        </div>
      </div>

      {state.error ? <p className="text-sm text-ajag-rojo-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-ajag-verde-700">Perfil actualizado.</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-ajag-verde-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
