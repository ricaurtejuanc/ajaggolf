"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Trash2, X, Check } from "lucide-react";
import {
  actualizarRecorrido,
  crearCampo,
  eliminarRecorrido,
  renombrarClub,
  type EstadoCampo,
} from "./actions";

interface Club {
  nombre: string;
  recorridos: { id: string; recorrido: string }[];
}

export function CamposList({ clubes }: { clubes: Club[] }) {
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
        <h2 className="font-display text-base font-semibold text-ajag-verde-900">
          Añadir campo/recorrido
        </h2>
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

      <input
        type="text"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar club o recorrido..."
        className="w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
      />

      <div className="flex flex-col gap-3">
        {clubesFiltrados.length === 0 ? (
          <p className="text-sm text-ajag-gris-500">Sin resultados.</p>
        ) : (
          clubesFiltrados.map((club) => <ClubCard key={club.nombre} club={club} />)
        )}
      </div>
    </div>
  );
}

function ClubCard({ club }: { club: Club }) {
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
          <RecorridoRow key={r.id} id={r.id} recorrido={r.recorrido} />
        ))}
      </ul>
    </div>
  );
}

function RecorridoRow({ id, recorrido }: { id: string; recorrido: string }) {
  const [editando, setEditando] = useState(false);
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
            <span className="text-sm text-ajag-gris-500">{recorrido}</span>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="text-ajag-gris-500 hover:text-ajag-verde-700"
                aria-label={`Editar recorrido ${recorrido}`}
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                disabled={pendiente}
                onClick={borrar}
                className="text-ajag-gris-500 hover:text-ajag-rojo-600 disabled:opacity-50"
                aria-label={`Eliminar recorrido ${recorrido}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </>
        )}
      </div>
      {error ? <p className="text-xs text-ajag-rojo-600">{error}</p> : null}
    </li>
  );
}
