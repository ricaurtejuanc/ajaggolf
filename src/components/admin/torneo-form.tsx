"use client";

import { useActionState } from "react";
import { PosterUploader } from "./poster-uploader";
import { CATEGORIAS_EXTRAS } from "@/lib/extras-torneo";
import type { EstadoTorneoForm } from "@/app/admin/torneos/actions";
import type { LigaPool, Torneo } from "@/types/database";

export function TorneoForm({
  torneo,
  ligas,
  action,
  textoBoton,
}: {
  torneo?: Torneo;
  ligas: LigaPool[];
  action: (prevState: EstadoTorneoForm, formData: FormData) => Promise<EstadoTorneoForm>;
  textoBoton: string;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, error: null });

  return (
    <form action={formAction} className="card-ajag flex flex-col gap-5 p-6">
      <PosterUploader posterUrlInicial={torneo?.poster_url ?? null} />

      <div>
        <label htmlFor="nombre" className="text-sm font-medium text-ajag-verde-900">
          Nombre *
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={torneo?.nombre}
          className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
        />
      </div>

      <div>
        <label htmlFor="campo_golf" className="block text-sm font-medium text-ajag-verde-900">
          Campo de golf *
        </label>
        <input
          id="campo_golf"
          name="campo_golf"
          required
          defaultValue={torneo?.campo_golf}
          className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="tees_masculino" className="block text-sm font-medium text-ajag-verde-900">
            Tees caballeros (separados por coma)
          </label>
          <input
            id="tees_masculino"
            name="tees_masculino"
            placeholder="Tee 54"
            defaultValue={torneo?.tees_masculino.join(", ")}
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          />
        </div>
        <div>
          <label htmlFor="tees_femenino" className="block text-sm font-medium text-ajag-verde-900">
            Tees damas (separados por coma)
          </label>
          <input
            id="tees_femenino"
            name="tees_femenino"
            placeholder="Tee 51"
            defaultValue={torneo?.tees_femenino.join(", ")}
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="fecha" className="block text-sm font-medium text-ajag-verde-900">
            Fecha *
          </label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            required
            defaultValue={torneo?.fecha}
            className="mt-1 w-full min-w-0 rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="hora_inicio" className="block text-sm font-medium text-ajag-verde-900">
            Hora de inicio
          </label>
          <input
            id="hora_inicio"
            name="hora_inicio"
            type="time"
            defaultValue={torneo?.hora_inicio ?? ""}
            className="mt-1 w-full min-w-0 rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="precio_euros" className="text-sm font-medium text-ajag-verde-900">
            Precio no socio (€) *
          </label>
          <input
            id="precio_euros"
            name="precio_euros"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={torneo ? (torneo.precio_cents / 100).toFixed(2) : "0"}
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          />
        </div>
        <div>
          <label htmlFor="precio_socio_euros" className="text-sm font-medium text-ajag-verde-900">
            Precio socio (€)
          </label>
          <input
            id="precio_socio_euros"
            name="precio_socio_euros"
            type="number"
            min={0}
            step="0.01"
            placeholder="Sin distinción"
            defaultValue={
              torneo?.precio_socio_cents != null
                ? (torneo.precio_socio_cents / 100).toFixed(2)
                : ""
            }
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          />
          <p className="mt-1 text-xs text-ajag-gris-500">
            Déjalo vacío si el torneo tiene un precio único.
          </p>
        </div>
        <div>
          <label htmlFor="cupo_maximo" className="text-sm font-medium text-ajag-verde-900">
            Cupo máximo
          </label>
          <input
            id="cupo_maximo"
            name="cupo_maximo"
            type="number"
            min={1}
            placeholder="Sin límite"
            defaultValue={torneo?.cupo_maximo ?? ""}
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          id="formato_puntuacion"
          label="Formato"
          defaultValue={torneo?.formato_puntuacion ?? "stableford"}
          options={[
            { value: "stableford", label: "Stableford" },
            { value: "medal_play", label: "Medal Play" },
          ]}
        />
        <Select
          id="modo_salida"
          label="Modo de salida"
          defaultValue={torneo?.modo_salida ?? "consecutivo"}
          options={[
            { value: "consecutivo", label: "Consecutivo (tee 1)" },
            { value: "shotgun", label: "A tiro (shotgun)" },
          ]}
        />
        <Select
          id="modo_asignacion_salida"
          label="Asignación de grupos"
          defaultValue={torneo?.modo_asignacion_salida ?? "handicap"}
          options={[
            { value: "handicap", label: "Automático por hándicap" },
            { value: "manual", label: "Manual" },
            { value: "mixto", label: "Mezcla de niveles" },
          ]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          id="estado"
          label="Estado"
          defaultValue={torneo?.estado ?? "borrador"}
          options={[
            { value: "borrador", label: "Borrador (oculto)" },
            { value: "publicado", label: "Publicado" },
            { value: "cerrado", label: "Cerrado" },
            { value: "finalizado", label: "Finalizado" },
          ]}
        />
        <div>
          <label htmlFor="liga_pool_id" className="text-sm font-medium text-ajag-verde-900">
            Liga / Pool
          </label>
          <select
            id="liga_pool_id"
            name="liga_pool_id"
            defaultValue={torneo?.liga_pool_id ?? ""}
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          >
            <option value="">Ninguna</option>
            {ligas.map((liga) => (
              <option key={liga.id} value={liga.id}>
                {liga.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className="text-sm font-medium text-ajag-verde-900">¿Cómo se paga?</span>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:gap-4">
          <label className="flex items-center gap-2 text-sm text-ajag-gris-500">
            <input
              type="radio"
              name="modo_pago"
              value="organizador"
              defaultChecked={(torneo?.modo_pago ?? "organizador") === "organizador"}
            />
            Al organizador (Bizum, un admin confirma el pago a mano)
          </label>
          <label className="flex items-center gap-2 text-sm text-ajag-gris-500">
            <input
              type="radio"
              name="modo_pago"
              value="club"
              defaultChecked={torneo?.modo_pago === "club"}
            />
            En el club (la inscripción queda confirmada al momento)
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="descripcion" className="text-sm font-medium text-ajag-verde-900">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={4}
          defaultValue={torneo?.descripcion ?? ""}
          className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
        />
      </div>

      <div>
        <label htmlFor="info_adicional" className="block text-sm font-medium text-ajag-verde-900">
          Información adicional
        </label>
        <textarea
          id="info_adicional"
          name="info_adicional"
          rows={3}
          defaultValue={torneo?.info_adicional ?? ""}
          className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
        />
      </div>

      <div>
        <span className="text-sm font-medium text-ajag-verde-900">
          Extras que se mostrarán en la ficha del torneo
        </span>
        <div className="mt-2 grid gap-4 sm:grid-cols-3">
          {CATEGORIAS_EXTRAS.map((cat) => (
            <div key={cat.categoria}>
              <p className="text-xs font-medium uppercase tracking-wide text-ajag-gris-500">
                {cat.categoria}
              </p>
              <div className="mt-1.5 flex flex-col gap-1.5">
                {cat.opciones.map((opcion) => (
                  <label
                    key={opcion.value}
                    className="flex items-center gap-2 text-sm text-ajag-gris-500"
                  >
                    <input
                      type="checkbox"
                      name="extras"
                      value={opcion.value}
                      defaultChecked={torneo?.extras.includes(opcion.value)}
                    />
                    {opcion.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

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

function Select({
  id,
  label,
  defaultValue,
  options,
}: {
  id: string;
  label: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ajag-verde-900">
        {label}
      </label>
      <select
        id={id}
        name={id}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-xl border border-ajag-gris-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
