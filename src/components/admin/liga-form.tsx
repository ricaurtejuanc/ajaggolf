"use client";

import { useActionState } from "react";
import { TablaPuntosEditor } from "./tabla-puntos-editor";
import { LigaImagenUploader } from "./liga-imagen-uploader";
import type { EstadoLigaForm } from "@/app/admin/ligas/actions";
import type { LigaPool } from "@/types/database";

export function LigaForm({
  liga,
  action,
  textoBoton,
}: {
  liga?: LigaPool;
  action: (prevState: EstadoLigaForm, formData: FormData) => Promise<EstadoLigaForm>;
  textoBoton: string;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, error: null });

  return (
    <form action={formAction} className="card-ajag flex flex-col gap-5 p-6">
      <LigaImagenUploader imagenUrlInicial={liga?.imagen_url} />

      <div>
        <label htmlFor="nombre" className="text-sm font-medium text-ajag-verde-900">
          Nombre *
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={liga?.nombre}
          className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="slug" className="text-sm font-medium text-ajag-verde-900">
            URL (slug)
          </label>
          <input
            id="slug"
            name="slug"
            placeholder="se genera automáticamente si lo dejas vacío"
            defaultValue={liga?.slug}
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          />
        </div>
        <div>
          <label htmlFor="temporada" className="text-sm font-medium text-ajag-verde-900">
            Temporada
          </label>
          <input
            id="temporada"
            name="temporada"
            placeholder="Ej. 2026"
            defaultValue={liga?.temporada ?? ""}
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          />
        </div>
      </div>

      <div>
        <label htmlFor="descripcion" className="text-sm font-medium text-ajag-verde-900">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          defaultValue={liga?.descripcion ?? ""}
          className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
        />
      </div>

      <div>
        <label htmlFor="reglas" className="text-sm font-medium text-ajag-verde-900">
          Reglas
        </label>
        <textarea
          id="reglas"
          name="reglas"
          rows={6}
          placeholder="Cómo se puntúa, qué torneos cuentan, criterios de desempate..."
          defaultValue={liga?.reglas ?? ""}
          className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
        />
        <p className="mt-1 text-xs text-ajag-gris-500">Se muestra públicamente en la página de la liga.</p>
      </div>

      <TablaPuntosEditor tablaInicial={liga?.tabla_puntos ?? {}} />

      <label className="flex items-center gap-2 text-sm text-ajag-verde-900">
        <input type="checkbox" name="activa" defaultChecked={liga?.activa ?? true} />
        Liga activa (visible públicamente)
      </label>

      {state.error ? <p className="text-sm text-ajag-rojo-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-ajag-verde-700">Guardado correctamente.</p> : null}

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
