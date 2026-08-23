"use client";

import { useActionState } from "react";
import { enviarEnlaceMagico } from "./actions";

export function EmailForm() {
  const [state, formAction, pending] = useActionState(enviarEnlaceMagico, {
    ok: false,
    error: null,
  });

  if (state.ok) {
    return (
      <div className="rounded-xl bg-ajag-verde-50 px-4 py-4 text-sm text-ajag-verde-900">
        Te hemos enviado un enlace de acceso. Revisa tu correo y pulsa en el enlace
        para entrar.
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm font-medium text-ajag-verde-900">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        placeholder="tu@email.com"
        className="rounded-xl border border-ajag-gris-200 px-4 py-3 text-sm outline-none focus:border-ajag-verde-600"
      />
      {state.error ? (
        <p className="text-sm text-ajag-rojo-600">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-ajag-verde-700 px-4 py-3 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar enlace de acceso"}
      </button>
    </form>
  );
}
