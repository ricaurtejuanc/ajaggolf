"use client";

import { useActionState } from "react";
import { actualizarWhatsappTelefono, type EstadoConfiguracion } from "./actions";

export function WhatsappForm({ telefonoActual }: { telefonoActual: string | null }) {
  const [state, formAction, pending] = useActionState<EstadoConfiguracion, FormData>(
    actualizarWhatsappTelefono,
    { ok: false, error: null },
  );

  return (
    <form action={formAction} className="card-ajag flex max-w-sm flex-col gap-3 p-5">
      <label htmlFor="whatsapp_telefono" className="text-sm font-medium text-ajag-verde-900">
        Teléfono de WhatsApp
      </label>
      <input
        id="whatsapp_telefono"
        name="whatsapp_telefono"
        defaultValue={telefonoActual ?? ""}
        placeholder="Ej. 600 00 00 00"
        className="rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
      />
      <p className="text-xs text-ajag-gris-500">
        Si lo rellenas, en el formulario de inscripción de tus torneos aparecerá la opción de
        gestionar la inscripción por WhatsApp a este número. Déjalo vacío para no mostrarla.
      </p>
      {state.error ? <p className="text-sm text-ajag-rojo-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-ajag-verde-700">Actualizado.</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-ajag-verde-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
