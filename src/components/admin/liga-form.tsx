"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
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
  const [modoPuntuacion, setModoPuntuacion] = useState(liga?.modo_puntuacion ?? "tabla_puntos");

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
          defaultValue={liga?.nombre ?? ""}
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

      <div>
        <span className="text-sm font-medium text-ajag-verde-900">Cómo se puntúa</span>
        <input type="hidden" name="modo_puntuacion" value={modoPuntuacion} />
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setModoPuntuacion("tabla_puntos")}
            aria-pressed={modoPuntuacion === "tabla_puntos"}
            className={`rounded-xl border px-4 py-2.5 text-left text-sm transition ${
              modoPuntuacion === "tabla_puntos"
                ? "border-ajag-verde-600 bg-ajag-verde-50 text-ajag-verde-900"
                : "border-ajag-gris-200 text-ajag-gris-500 hover:border-ajag-verde-300"
            }`}
          >
            <span className="block font-medium">Puntos por posición</span>
            <span className="text-xs">Tabla configurable: 1º, 2º, 3º...</span>
          </button>
          <button
            type="button"
            onClick={() => setModoPuntuacion("suma_stableford")}
            aria-pressed={modoPuntuacion === "suma_stableford"}
            className={`rounded-xl border px-4 py-2.5 text-left text-sm transition ${
              modoPuntuacion === "suma_stableford"
                ? "border-ajag-verde-600 bg-ajag-verde-50 text-ajag-verde-900"
                : "border-ajag-gris-200 text-ajag-gris-500 hover:border-ajag-verde-300"
            }`}
          >
            <span className="block font-medium">Suma de puntos Stableford</span>
            <span className="text-xs">Se suman los puntos de cada torneo, sin tabla</span>
          </button>
        </div>
      </div>

      {modoPuntuacion === "tabla_puntos" ? (
        <TablaPuntosEditor tablaInicial={liga?.tabla_puntos ?? {}} />
      ) : null}

      <div>
        <span className="text-sm font-medium text-ajag-verde-900">Tipo</span>
        <p className="mt-1 text-xs text-ajag-gris-500">
          Puedes crear tantas ligas como quieras por temática (ej. Liga de Damas, Liga
          Senior...) y todas se pueden elegir al crear un torneo. Márcala como Ranking o Pool
          oficial solo para destacarla como tal en la lista pública: solo puede haber una de
          cada tipo.
        </p>
        <div className="mt-2 flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-ajag-gris-500">
            <input
              type="radio"
              name="tipo_oficial"
              value=""
              defaultChecked={!liga?.tipo_oficial}
            />
            Liga temática
          </label>
          <label className="flex items-center gap-2 text-sm text-ajag-gris-500">
            <input
              type="radio"
              name="tipo_oficial"
              value="ranking"
              defaultChecked={liga?.tipo_oficial === "ranking"}
            />
            Ranking oficial
          </label>
          <label className="flex items-center gap-2 text-sm text-ajag-gris-500">
            <input
              type="radio"
              name="tipo_oficial"
              value="pool"
              defaultChecked={liga?.tipo_oficial === "pool"}
            />
            Pool oficial
          </label>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ajag-verde-900">
        <input type="checkbox" name="activa" defaultChecked={liga?.activa ?? true} />
        Liga activa (visible públicamente)
      </label>

      {state.error ? <p className="text-sm text-ajag-rojo-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-ajag-verde-700">Guardado correctamente.</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-ajag-verde-700 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
        >
          {pending ? "Guardando..." : textoBoton}
        </button>
        <Link
          href="/admin/ligas"
          className="rounded-xl px-6 py-2.5 text-sm font-medium text-ajag-gris-500 transition hover:bg-ajag-gris-100"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
