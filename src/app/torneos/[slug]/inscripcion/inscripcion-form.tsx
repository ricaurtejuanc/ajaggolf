"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { inscribirse, type EstadoInscripcionForm } from "./actions";
import { formatearPrecio } from "@/lib/format";
import type { Jugador } from "@/types/database";

const MAX_ACOMPANANTES = 3;

export function InscripcionForm({
  torneoSlug,
  jugador,
  precioCents,
  precioSocioCents,
}: {
  torneoSlug: string;
  jugador: Jugador;
  precioCents: number;
  precioSocioCents: number | null;
}) {
  const accionConSlug = inscribirse.bind(null, torneoSlug);
  const [state, formAction, pending] = useActionState<EstadoInscripcionForm, FormData>(
    accionConSlug,
    { ok: false, error: null },
  );

  const [juegaConAlguien, setJuegaConAlguien] = useState(false);
  const [acompanantes, setAcompanantes] = useState<number[]>([0]);
  const [esSocio, setEsSocio] = useState<"si" | "no" | null>(null);
  const tieneDistincionSocio = precioSocioCents != null;
  const precioMostrado =
    tieneDistincionSocio && esSocio === "si" ? precioSocioCents! : precioCents;

  return (
    <form action={formAction} className="card-ajag flex flex-col gap-5 p-6">
      <div>
        <label htmlFor="nombre" className="text-sm font-medium text-ajag-verde-900">
          Nombre completo *
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={jugador.nombre}
          className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-ajag-verde-900">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={jugador.email ?? ""}
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          />
        </div>
        <div>
          <label htmlFor="licencia_federativa" className="text-sm font-medium text-ajag-verde-900">
            Licencia federativa *
          </label>
          <input
            id="licencia_federativa"
            name="licencia_federativa"
            required
            defaultValue={jugador.licencia_federativa ?? ""}
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
          />
        </div>
      </div>

      <div>
        <label htmlFor="handicap" className="text-sm font-medium text-ajag-verde-900">
          Hándicap
        </label>
        <input
          id="handicap"
          name="handicap"
          type="number"
          step="0.1"
          placeholder="Ej. 18.4"
          defaultValue={jugador.handicap ?? ""}
          className="mt-1 w-full max-w-[10rem] rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
        />
        <p className="mt-1 text-xs text-ajag-gris-500">
          Se usa para formar los grupos de salida por nivel.
        </p>
      </div>

      {tieneDistincionSocio ? (
        <div>
          <span className="text-sm font-medium text-ajag-verde-900">
            ¿Eres socio del club? *
          </span>
          <div className="mt-1 flex gap-4">
            <label className="flex items-center gap-2 text-sm text-ajag-gris-500">
              <input
                type="radio"
                name="es_socio"
                value="si"
                required
                checked={esSocio === "si"}
                onChange={() => setEsSocio("si")}
              />
              Sí, soy socio ({formatearPrecio(precioSocioCents!)})
            </label>
            <label className="flex items-center gap-2 text-sm text-ajag-gris-500">
              <input
                type="radio"
                name="es_socio"
                value="no"
                required
                checked={esSocio === "no"}
                onChange={() => setEsSocio("no")}
              />
              No ({formatearPrecio(precioCents)})
            </label>
          </div>
        </div>
      ) : null}

      <div>
        <span className="text-sm font-medium text-ajag-verde-900">Sexo *</span>
        <div className="mt-1 flex gap-4">
          {(["masculino", "femenino"] as const).map((valor) => (
            <label key={valor} className="flex items-center gap-2 text-sm text-ajag-gris-500">
              <input
                type="radio"
                name="sexo"
                value={valor}
                required
                defaultChecked={jugador.sexo === valor}
              />
              {valor === "masculino" ? "Masculino" : "Femenino"}
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-ajag-gris-100 pt-4">
        <span className="text-sm font-medium text-ajag-verde-900">
          ¿Juegas con alguien en la partida?
        </span>
        <div className="mt-1 flex gap-4">
          <label className="flex items-center gap-2 text-sm text-ajag-gris-500">
            <input
              type="radio"
              name="juega_con_alguien_ui"
              checked={juegaConAlguien}
              onChange={() => setJuegaConAlguien(true)}
            />
            Sí
          </label>
          <label className="flex items-center gap-2 text-sm text-ajag-gris-500">
            <input
              type="radio"
              name="juega_con_alguien_ui"
              checked={!juegaConAlguien}
              onChange={() => setJuegaConAlguien(false)}
            />
            No
          </label>
        </div>

        {juegaConAlguien ? (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-xs text-ajag-gris-500">
              Indica la licencia federativa de con quién quieres jugar. El
              organizador intentará agruparos, pero puede requerir ajustes
              según el criterio de handicap del torneo.
            </p>
            {acompanantes.map((key) => (
              <div key={key} className="flex items-center gap-2">
                <input
                  name="juega_con_licencia"
                  placeholder="Licencia federativa del acompañante"
                  className="w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
                />
                {acompanantes.length > 1 ? (
                  <button
                    type="button"
                    aria-label="Quitar"
                    onClick={() =>
                      setAcompanantes((prev) => prev.filter((k) => k !== key))
                    }
                    className="text-ajag-gris-500 hover:text-ajag-rojo-600"
                  >
                    <X size={18} />
                  </button>
                ) : null}
              </div>
            ))}
            {acompanantes.length < MAX_ACOMPANANTES ? (
              <button
                type="button"
                onClick={() =>
                  setAcompanantes((prev) => [...prev, (prev.at(-1) ?? 0) + 1])
                }
                className="flex w-fit items-center gap-1 text-sm font-medium text-ajag-verde-700 hover:underline"
              >
                <Plus size={16} /> Añadir otro jugador
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {state.error ? <p className="text-sm text-ajag-rojo-600">{state.error}</p> : null}

      <div className="flex items-center justify-between border-t border-ajag-gris-100 pt-4">
        <span className="text-sm text-ajag-gris-500">Precio de la inscripción</span>
        <span className="font-display text-lg font-semibold text-ajag-verde-900">
          {formatearPrecio(precioMostrado)}
        </span>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-ajag-verde-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
      >
        {pending ? "Añadiendo..." : "Añadir al carrito"}
      </button>
    </form>
  );
}
