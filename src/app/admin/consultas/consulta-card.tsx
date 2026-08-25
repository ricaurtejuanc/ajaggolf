"use client";

import { useActionState, useState, useTransition } from "react";
import { marcarConsultaLeida, responderConsulta } from "./actions";
import { formatearFechaCorta } from "@/lib/format";
import type { ConsultaContacto } from "@/types/database";

export function ConsultaCard({ consulta }: { consulta: ConsultaContacto }) {
  const [pending, startTransition] = useTransition();
  const [respondiendo, setRespondiendo] = useState(false);

  const accion = responderConsulta.bind(null, consulta.id);
  const [estado, dispatch, pendingRespuesta] = useActionState(accion, {
    ok: false,
    error: null,
    aviso: null,
  });

  return (
    <div className={`card-ajag p-5 ${consulta.leido ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-ajag-verde-900">{consulta.nombre}</p>
          <p className="text-sm text-ajag-gris-500">
            {consulta.email}
            {consulta.telefono ? ` · ${consulta.telefono}` : ""}
          </p>
        </div>
        <span className="text-xs text-ajag-gris-500">
          {formatearFechaCorta(consulta.created_at.slice(0, 10))}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-line text-sm text-ajag-verde-900">{consulta.mensaje}</p>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        {!consulta.leido ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => marcarConsultaLeida(consulta.id))}
            className="text-sm font-medium text-ajag-verde-700 hover:underline disabled:opacity-50"
          >
            Marcar como leída
          </button>
        ) : null}
        {!consulta.respuesta ? (
          <button
            type="button"
            onClick={() => setRespondiendo((v) => !v)}
            className="text-sm font-medium text-ajag-verde-700 hover:underline"
          >
            {respondiendo ? "Cancelar" : "Responder"}
          </button>
        ) : null}
      </div>

      {estado.aviso ? (
        <p className="mt-3 rounded-lg bg-ajag-oro-500/15 px-3 py-2 text-sm font-medium text-ajag-oro-600">
          {estado.aviso}
        </p>
      ) : null}

      {consulta.respuesta ? (
        <div className="mt-3 rounded-xl bg-ajag-verde-50 p-3">
          <p className="mb-1 text-xs font-medium text-ajag-verde-700">
            Tu respuesta
            {consulta.respondido_at
              ? ` · ${formatearFechaCorta(consulta.respondido_at.slice(0, 10))}`
              : ""}
          </p>
          <p className="whitespace-pre-line text-sm text-ajag-verde-900">{consulta.respuesta}</p>
        </div>
      ) : respondiendo ? (
        <form action={dispatch} className="mt-3 flex flex-col gap-2">
          <textarea
            name="respuesta"
            required
            rows={3}
            placeholder="Escribe tu respuesta..."
            className="w-full rounded-xl border border-ajag-gris-200 px-3 py-2 text-sm outline-none focus:border-ajag-verde-600"
          />
          {estado.error ? <p className="text-sm text-ajag-rojo-600">{estado.error}</p> : null}
          <button
            type="submit"
            disabled={pendingRespuesta}
            className="w-fit rounded-xl bg-ajag-verde-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
          >
            {pendingRespuesta ? "Enviando..." : "Enviar respuesta"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
