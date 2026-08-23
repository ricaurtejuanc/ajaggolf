"use client";

import { cerrarSesion } from "./actions";

export function SignOutButton() {
  return (
    <form action={cerrarSesion}>
      <button
        type="submit"
        className="rounded-xl border border-ajag-gris-200 px-4 py-2 text-sm font-medium text-ajag-gris-500 transition hover:border-ajag-rojo-600 hover:text-ajag-rojo-600"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
