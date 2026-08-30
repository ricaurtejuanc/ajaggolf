"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Trash2, X, Check } from "lucide-react";
import {
  actualizarRecorrido,
  actualizarTee,
  crearCampo,
  crearTee,
  eliminarRecorrido,
  eliminarTee,
  renombrarClub,
  type EstadoCampo,
} from "./actions";

/** Valoración de una barra: lo que necesita la calculadora de hándicap. */
export interface TeeVista {
  id: string;
  tee: string;
  genero: "H" | "M";
  cr: number;
  slope: number;
  par: number;
}

interface Club {
  nombre: string;
  recorridos: { id: string; recorrido: string; tees: TeeVista[] }[];
}

export function CamposList({ clubes, esOwner }: { clubes: Club[]; esOwner: boolean }) {
  const [busqueda, setBusqueda] = useState("");
  const [estadoAlta, dispatchAlta, pendingAlta] = useActionState<EstadoCampo, FormData>(crearCampo, {
    ok: false,
    error: null,
  });

  const clubesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return clubes;
    return clubes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(texto) ||
        c.recorridos.some((r) => r.recorrido.toLowerCase().includes(texto)),
    );
  }, [clubes, busqueda]);

  return (
    <div className="flex flex-col gap-6">
      <form action={dispatchAlta} className="card-ajag flex flex-col gap-4 p-5">
        <div>
          <h2 className="font-display text-base font-semibold text-ajag-verde-900">
            Añadir campo/recorrido
          </h2>
          <p className="mt-0.5 text-xs text-ajag-gris-500">
            Se usa para sugerir campo y recorrido al crear un torneo.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nombre" className="text-sm font-medium text-ajag-verde-900">
              Nombre del club *
            </label>
            <input
              id="nombre"
              name="nombre"
              required
              list="clubes-existentes"
              placeholder="Ej. Real Club de Golf..."
              className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
            />
            <datalist id="clubes-existentes">
              {clubes.map((c) => (
                <option key={c.nombre} value={c.nombre} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="recorrido" className="text-sm font-medium text-ajag-verde-900">
              Recorrido *
            </label>
            <input
              id="recorrido"
              name="recorrido"
              required
              placeholder="Ej. 18 hoyos"
              className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
            />
          </div>
        </div>
        {estadoAlta.error ? <p className="text-sm text-ajag-rojo-600">{estadoAlta.error}</p> : null}
        <button
          type="submit"
          disabled={pendingAlta}
          className="flex w-fit items-center gap-1.5 rounded-xl bg-ajag-verde-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
        >
          <Plus size={15} /> {pendingAlta ? "Añadiendo..." : "Añadir"}
        </button>
      </form>

      <div className="border-t border-ajag-gris-100 pt-6">
        <h2 className="font-display text-lg font-semibold text-ajag-verde-900">Slope de Campos</h2>
        <p className="mt-0.5 mb-4 text-sm text-ajag-gris-500">
          Valoraciones (Course Rating, Slope y par) de cada barra por recorrido: es lo que
          alimenta la calculadora de hándicap. Busca un club o recorrido y edita sus barras.
        </p>

        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar club o recorrido..."
          className="w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
        />

        <div className="mt-4 flex flex-col gap-3">
          {clubesFiltrados.length === 0 ? (
            <p className="text-sm text-ajag-gris-500">Sin resultados.</p>
          ) : (
            clubesFiltrados.map((club) => (
              <ClubCard key={club.nombre} club={club} esOwner={esOwner} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ClubCard({ club, esOwner }: { club: Club; esOwner: boolean }) {
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombreEditado, setNombreEditado] = useState(club.nombre);
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function guardarNombre() {
    if (nombreEditado.trim() === club.nombre) {
      setEditandoNombre(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      const resultado = await renombrarClub(club.nombre, nombreEditado);
      if (!resultado.ok) setError(resultado.error);
      else setEditandoNombre(false);
    });
  }

  return (
    <div className="card-ajag flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        {editandoNombre ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              value={nombreEditado}
              onChange={(e) => setNombreEditado(e.target.value)}
              autoFocus
              className="flex-1 rounded-lg border border-ajag-gris-200 px-3 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
            />
            <button
              type="button"
              disabled={pendiente}
              onClick={guardarNombre}
              className="text-ajag-verde-700 hover:text-ajag-verde-900 disabled:opacity-50"
              aria-label="Guardar nombre"
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                setNombreEditado(club.nombre);
                setEditandoNombre(false);
                setError(null);
              }}
              className="text-ajag-gris-500 hover:text-ajag-rojo-600"
              aria-label="Cancelar"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm font-medium text-ajag-verde-900">
            {club.nombre}
            <button
              type="button"
              onClick={() => setEditandoNombre(true)}
              className="text-ajag-gris-500 hover:text-ajag-verde-700"
              aria-label={`Editar nombre de ${club.nombre}`}
            >
              <Pencil size={13} />
            </button>
          </p>
        )}
        <span className="shrink-0 text-xs text-ajag-gris-500">
          {club.recorridos.length} recorrido{club.recorridos.length === 1 ? "" : "s"}
        </span>
      </div>
      {error ? <p className="text-xs text-ajag-rojo-600">{error}</p> : null}

      <ul className="flex flex-col gap-1.5">
        {club.recorridos.map((r) => (
          <RecorridoRow
            key={r.id}
            id={r.id}
            club={club.nombre}
            recorrido={r.recorrido}
            tees={r.tees}
            esOwner={esOwner}
          />
        ))}
      </ul>
    </div>
  );
}

function RecorridoRow({
  id,
  club,
  recorrido,
  tees,
  esOwner,
}: {
  id: string;
  club: string;
  recorrido: string;
  tees: TeeVista[];
  esOwner: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [verTees, setVerTees] = useState(false);
  const [valor, setValor] = useState(recorrido);
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function guardar() {
    if (valor.trim() === recorrido) {
      setEditando(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      const resultado = await actualizarRecorrido(id, valor);
      if (!resultado.ok) setError(resultado.error);
      else setEditando(false);
    });
  }

  function borrar() {
    if (!confirm(`¿Quitar el recorrido "${recorrido}" del catálogo?`)) return;
    startTransition(async () => {
      await eliminarRecorrido(id);
    });
  }

  return (
    <li className="flex flex-col gap-1 border-t border-ajag-gris-100 pt-1.5 first:border-0 first:pt-0">
      <div className="flex items-center justify-between gap-2">
        {editando ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              autoFocus
              className="flex-1 rounded-lg border border-ajag-gris-200 px-3 py-1 text-sm outline-none focus:border-ajag-verde-600"
            />
            <button
              type="button"
              disabled={pendiente}
              onClick={guardar}
              className="text-ajag-verde-700 hover:text-ajag-verde-900 disabled:opacity-50"
              aria-label="Guardar recorrido"
            >
              <Check size={15} />
            </button>
            <button
              type="button"
              onClick={() => {
                setValor(recorrido);
                setEditando(false);
                setError(null);
              }}
              className="text-ajag-gris-500 hover:text-ajag-rojo-600"
              aria-label="Cancelar"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setVerTees((v) => !v)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm text-ajag-gris-500 hover:text-ajag-verde-900"
            >
              <span className="truncate">{recorrido}</span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                  tees.length > 0
                    ? "bg-ajag-verde-50 text-ajag-verde-700"
                    : "bg-ajag-gris-100 text-ajag-gris-500"
                }`}
              >
                {tees.length > 0 ? `${tees.length} barras` : "sin valorar"}
              </span>
            </button>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="text-ajag-gris-500 hover:text-ajag-verde-700"
                aria-label={`Editar recorrido ${recorrido}`}
              >
                <Pencil size={13} />
              </button>
              {esOwner && (
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={borrar}
                  className="text-ajag-gris-500 hover:text-ajag-rojo-600 disabled:opacity-50"
                  aria-label={`Eliminar recorrido ${recorrido}`}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
      {error ? <p className="text-xs text-ajag-rojo-600">{error}</p> : null}
      {verTees ? <TeesRecorrido club={club} recorrido={recorrido} tees={tees} /> : null}
    </li>
  );
}

const claseCelda =
  "w-full rounded-lg border border-ajag-gris-200 px-2 py-1 text-sm outline-none focus:border-ajag-verde-600";

/** Alta, edición y borrado de las barras valoradas de un recorrido. */
function TeesRecorrido({
  club,
  recorrido,
  tees,
}: {
  club: string;
  recorrido: string;
  tees: TeeVista[];
}) {
  const alta = crearTee.bind(null, club, recorrido);
  const [estado, dispatch, pendiente] = useActionState<EstadoCampo, FormData>(alta, {
    ok: false,
    error: null,
  });

  return (
    <div className="mt-2 rounded-xl bg-ajag-verde-50/50 p-3">
      {tees.length === 0 ? (
        <p className="text-xs text-ajag-gris-500">
          Este recorrido no tiene valoración, así que no aparece en la calculadora de hándicap.
          Añade sus barras con el CR y el slope de la tarjeta.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {tees.map((t) => (
            <TeeRow key={t.id} tee={t} />
          ))}
        </ul>
      )}

      <form action={dispatch} className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-6">
        <input name="tee" placeholder="Barra" aria-label="Barra" className={claseCelda} />
        <select name="genero" aria-label="Género" defaultValue="H" className={claseCelda}>
          <option value="H">Caballeros</option>
          <option value="M">Damas</option>
        </select>
        <input name="cr" inputMode="decimal" placeholder="CR" aria-label="CR" className={claseCelda} />
        <input name="slope" inputMode="numeric" placeholder="Slope" aria-label="Slope" className={claseCelda} />
        <input name="par" inputMode="numeric" placeholder="Par" aria-label="Par" className={claseCelda} />
        <button
          type="submit"
          disabled={pendiente}
          className="rounded-lg bg-ajag-verde-700 px-3 py-1 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
        >
          {pendiente ? "..." : "Añadir"}
        </button>
      </form>
      {estado.error ? <p className="mt-1 text-xs text-ajag-rojo-600">{estado.error}</p> : null}
    </div>
  );
}

function TeeRow({ tee }: { tee: TeeVista }) {
  const [editando, setEditando] = useState(false);
  const [pendiente, startTransition] = useTransition();
  const guardar = actualizarTee.bind(null, tee.id);
  const [estado, dispatch, guardando] = useActionState<EstadoCampo, FormData>(guardar, {
    ok: false,
    error: null,
  });

  if (editando) {
    return (
      <li>
        <form action={dispatch} className="grid grid-cols-2 gap-2 sm:grid-cols-6">
          <input name="tee" defaultValue={tee.tee} aria-label="Barra" className={claseCelda} />
          <select name="genero" defaultValue={tee.genero} aria-label="Género" className={claseCelda}>
            <option value="H">Caballeros</option>
            <option value="M">Damas</option>
          </select>
          <input name="cr" defaultValue={tee.cr} inputMode="decimal" aria-label="CR" className={claseCelda} />
          <input name="slope" defaultValue={tee.slope} inputMode="numeric" aria-label="Slope" className={claseCelda} />
          <input name="par" defaultValue={tee.par} inputMode="numeric" aria-label="Par" className={claseCelda} />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={guardando}
              className="text-ajag-verde-700 hover:text-ajag-verde-900 disabled:opacity-50"
              aria-label="Guardar barra"
            >
              <Check size={15} />
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="text-ajag-gris-500 hover:text-ajag-rojo-600"
              aria-label="Cancelar"
            >
              <X size={15} />
            </button>
          </div>
        </form>
        {estado.error ? <p className="mt-1 text-xs text-ajag-rojo-600">{estado.error}</p> : null}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 text-xs text-ajag-gris-500">
      <span className="min-w-0 truncate">
        <span className="font-medium text-ajag-verde-900">{tee.tee}</span>{" "}
        {tee.genero === "H" ? "caballeros" : "damas"} · CR {tee.cr} · Slope {tee.slope} · Par{" "}
        {tee.par}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="text-ajag-gris-500 hover:text-ajag-verde-700"
          aria-label={`Editar barra ${tee.tee}`}
        >
          <Pencil size={12} />
        </button>
        <button
          type="button"
          disabled={pendiente}
          onClick={() => {
            if (confirm(`¿Quitar la barra ${tee.tee}? También borra su tarjeta hoyo a hoyo.`)) {
              startTransition(() => {
                void eliminarTee(tee.id);
              });
            }
          }}
          className="text-ajag-gris-500 hover:text-ajag-rojo-600 disabled:opacity-50"
          aria-label={`Eliminar barra ${tee.tee}`}
        >
          <Trash2 size={12} />
        </button>
      </span>
    </li>
  );
}
