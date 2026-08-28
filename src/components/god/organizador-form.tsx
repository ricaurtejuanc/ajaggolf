"use client";

import { useActionState } from "react";
import { OrganizadorLogoUploader } from "./organizador-logo-uploader";
import type { EstadoOrganizadorForm } from "@/app/god/organizadores/actions";
import type { Organizador } from "@/types/database";

export function OrganizadorForm({
  organizador,
  action,
  textoBoton,
}: {
  organizador?: Organizador;
  action: (prevState: EstadoOrganizadorForm, formData: FormData) => Promise<EstadoOrganizadorForm>;
  textoBoton: string;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, error: null });

  return (
    <form action={formAction} className="card-aftergolf flex max-w-lg flex-col gap-5 p-6">
      <OrganizadorLogoUploader logoUrlInicial={organizador?.logo_url} />

      <div>
        <label htmlFor="nombre" className="text-sm font-medium text-aftergolf-verde-900">
          Nombre *
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={organizador?.nombre}
          className="mt-1 w-full rounded-xl border border-aftergolf-oro-200 px-4 py-2.5 text-sm outline-none focus:border-aftergolf-verde-600"
        />
      </div>

      <div>
        <label htmlFor="slug" className="text-sm font-medium text-aftergolf-verde-900">
          URL (slug)
        </label>
        <input
          id="slug"
          name="slug"
          placeholder="se genera automáticamente si lo dejas vacío"
          defaultValue={organizador?.slug}
          className="mt-1 w-full rounded-xl border border-aftergolf-oro-200 px-4 py-2.5 text-sm outline-none focus:border-aftergolf-verde-600"
        />
        <p className="mt-1 text-xs text-ajag-gris-500">
          Ej. &quot;ajag&quot; → torneos.aftergolf.es/ajag (o subdominio ajag.torneos.aftergolf.es).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="color_primario" className="text-sm font-medium text-aftergolf-verde-900">
            Color primario
          </label>
          <input
            id="color_primario"
            name="color_primario"
            type="text"
            placeholder="#1e4a2c"
            defaultValue={organizador?.color_primario ?? ""}
            className="mt-1 w-full rounded-xl border border-aftergolf-oro-200 px-4 py-2.5 text-sm outline-none focus:border-aftergolf-verde-600"
          />
        </div>
        <div>
          <label htmlFor="dominio" className="text-sm font-medium text-aftergolf-verde-900">
            Dominio propio
          </label>
          <input
            id="dominio"
            name="dominio"
            type="text"
            placeholder="torneos.suclub.com"
            defaultValue={organizador?.dominio ?? ""}
            className="mt-1 w-full rounded-xl border border-aftergolf-oro-200 px-4 py-2.5 text-sm outline-none focus:border-aftergolf-verde-600"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email_contacto" className="text-sm font-medium text-aftergolf-verde-900">
          Email de contacto
        </label>
        <input
          id="email_contacto"
          name="email_contacto"
          type="email"
          defaultValue={organizador?.email_contacto ?? ""}
          className="mt-1 w-full rounded-xl border border-aftergolf-oro-200 px-4 py-2.5 text-sm outline-none focus:border-aftergolf-verde-600"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-aftergolf-verde-900">
        <input type="checkbox" name="activo" defaultChecked={organizador?.activo ?? true} />
        Organizador activo
      </label>

      {state.error ? <p className="text-sm text-aftergolf-granate">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-aftergolf-verde-700 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-aftergolf-verde-600 disabled:opacity-60"
      >
        {pending ? "Guardando..." : textoBoton}
      </button>
    </form>
  );
}
