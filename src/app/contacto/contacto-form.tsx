"use client";

import { useActionState } from "react";
import { enviarConsulta, type EstadoContacto } from "./actions";

export function ContactoForm() {
  const [state, formAction, pending] = useActionState<EstadoContacto, FormData>(
    enviarConsulta,
    { ok: false, error: null },
  );

  if (state.ok) {
    return (
      <div className="card-ajag p-6 text-center text-ajag-verde-900">
        Gracias por tu mensaje. Te responderemos lo antes posible.
      </div>
    );
  }

  return (
    <form action={formAction} className="card-ajag flex flex-col gap-4 p-6">
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

      <div>
        <label htmlFor="telefono" className="text-sm font-medium text-ajag-verde-900">
          Teléfono
        </label>
        <input
          id="telefono"
          name="telefono"
          className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
        />
      </div>

      <div>
        <label htmlFor="mensaje" className="text-sm font-medium text-ajag-verde-900">
          Mensaje *
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          required
          rows={5}
          className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
        />
      </div>

      {state.error ? <p className="text-sm text-ajag-rojo-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-ajag-verde-700 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar mensaje"}
      </button>
    </form>
  );
}
