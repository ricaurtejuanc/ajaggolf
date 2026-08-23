"use client";

import { useActionState } from "react";
import { LogoUploader } from "./logo-uploader";
import type { EstadoPatrocinadorForm } from "@/app/admin/patrocinadores/actions";
import type { Patrocinador } from "@/types/database";

export function PatrocinadorForm({
  patrocinador,
  action,
  textoBoton,
}: {
  patrocinador?: Patrocinador;
  action: (prevState: EstadoPatrocinadorForm, formData: FormData) => Promise<EstadoPatrocinadorForm>;
  textoBoton: string;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, error: null });

  return (
    <form action={formAction} className="card-ajag flex max-w-lg flex-col gap-5 p-6">
      <LogoUploader logoUrlInicial={patrocinador?.logo_url} />

      <div>
        <label htmlFor="nombre" className="text-sm font-medium text-ajag-verde-900">
          Nombre *
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={patrocinador?.nombre}
          className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
        />
      </div>

      <div>
        <label htmlFor="web" className="text-sm font-medium text-ajag-verde-900">
          Página web
        </label>
        <input
          id="web"
          name="web"
          type="url"
          placeholder="https://..."
          defaultValue={patrocinador?.web ?? ""}
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
          defaultValue={patrocinador?.telefono ?? ""}
          className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
        />
        <p className="mt-1 text-xs text-ajag-gris-500">
          Se muestra al pinchar el logo cuando no hay página web.
        </p>
      </div>

      {state.error ? <p className="text-sm text-ajag-rojo-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-ajag-verde-700 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
      >
        {pending ? "Guardando..." : textoBoton}
      </button>
    </form>
  );
}
