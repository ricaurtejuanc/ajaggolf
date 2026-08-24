"use client";

import { useActionState, useState } from "react";
import { PosterUploader } from "./poster-uploader";
import { TeesInput } from "./tees-input";
import { CampoGolfInput } from "./campo-golf-input";
import { PremiosEditor } from "./premios-editor";
import { HorariosPdfUploader } from "./horarios-pdf-uploader";
import type { EstadoTorneoForm } from "@/app/admin/torneos/actions";
import type { CategoriaExtra, LigaPool, ModoSalida, Torneo } from "@/types/database";

export function TorneoForm({
  torneo,
  ligas,
  camposGolf,
  categoriasExtras,
  action,
  textoBoton,
}: {
  torneo?: Torneo;
  ligas: LigaPool[];
  camposGolf: { nombre: string; recorrido: string }[];
  categoriasExtras: CategoriaExtra[];
  action: (prevState: EstadoTorneoForm, formData: FormData) => Promise<EstadoTorneoForm>;
  textoBoton: string;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, error: null });
  const [modoSalida, setModoSalida] = useState<ModoSalida>(torneo?.modo_salida ?? "consecutivo");
  const [teesConsecutivo, setTeesConsecutivo] = useState<Set<number>>(
    new Set(torneo?.tees_consecutivo && torneo.tees_consecutivo.length > 0 ? torneo.tees_consecutivo : [1]),
  );

  return (
    <form action={formAction} className="card-ajag flex flex-col gap-5 p-6">
      <PosterUploader
        posterUrlInicial={torneo?.poster_url ?? null}
        focalXInicial={torneo?.poster_focal_x}
        focalYInicial={torneo?.poster_focal_y}
      />

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

      <CampoGolfInput
        campos={camposGolf}
        campoInicial={torneo?.campo_golf}
        recorridoInicial={torneo?.recorrido}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TeesInput
          name="tees_masculino"
          label="Tees caballeros"
          placeholder="Tee 54"
          valoresIniciales={torneo?.tees_masculino ?? []}
        />
        <TeesInput
          name="tees_femenino"
          label="Tees damas"
          placeholder="Tee 51"
          valoresIniciales={torneo?.tees_femenino ?? []}
        />
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
        <div>
          <label htmlFor="modo_salida" className="block text-sm font-medium text-ajag-verde-900">
            Modo de salida
          </label>
          <select
            id="modo_salida"
            name="modo_salida"
            value={modoSalida}
            onChange={(e) => setModoSalida(e.target.value as ModoSalida)}
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          >
            <option value="consecutivo">Consecutivo</option>
            <option value="shotgun">A tiro (shotgun)</option>
          </select>
        </div>
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

      {modoSalida === "consecutivo" ? (
        <div>
          <span className="text-sm font-medium text-ajag-verde-900">
            Tee de salida (consecutivo)
          </span>
          <div className="mt-1 flex gap-4">
            {[1, 10].map((tee) => (
              <label key={tee} className="flex items-center gap-2 text-sm text-ajag-gris-500">
                <input
                  type="checkbox"
                  name="tees_consecutivo"
                  value={tee}
                  checked={teesConsecutivo.has(tee)}
                  onChange={() =>
                    setTeesConsecutivo((prev) => {
                      const copia = new Set(prev);
                      if (copia.has(tee)) copia.delete(tee);
                      else copia.add(tee);
                      return copia;
                    })
                  }
                />
                Tee {tee}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-ajag-gris-500">
            Se usa como valor por defecto al generar el cuadro de salidas; se puede cambiar ahí.
          </p>
        </div>
      ) : null}

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
            Puntúa para Ranking/Pool
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
          {ligas.length === 0 ? (
            <p className="mt-1 text-xs text-ajag-gris-500">
              No hay ningún Ranking ni Pool dado de alta todavía (Admin → Ligas y Pool, con
              slug &quot;ranking&quot; o &quot;pool&quot;).
            </p>
          ) : null}
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
        <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoriasExtras.map((cat) => (
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

      <PremiosEditor premiosIniciales={torneo?.premios ?? []} />

      <HorariosPdfUploader pdfUrlInicial={torneo?.horarios_pdf_url} />

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
