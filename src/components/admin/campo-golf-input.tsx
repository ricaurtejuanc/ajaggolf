"use client";

import { useMemo, useRef, useState } from "react";

export function CampoGolfInput({
  campos,
  campoInicial = "",
  recorridoInicial,
}: {
  campos: { nombre: string; recorrido: string }[];
  campoInicial?: string;
  recorridoInicial?: string | null;
}) {
  const [campo, setCampo] = useState(campoInicial);
  const [recorrido, setRecorrido] = useState(recorridoInicial ?? "");
  const [listaAbierta, setListaAbierta] = useState<"campo" | "recorrido" | null>(null);

  const nombresUnicos = useMemo(() => {
    const vistos = new Set<string>();
    const lista: string[] = [];
    for (const c of campos) {
      if (!vistos.has(c.nombre)) {
        vistos.add(c.nombre);
        lista.push(c.nombre);
      }
    }
    return lista;
  }, [campos]);

  const sugerenciasCampo = useMemo(() => {
    const texto = campo.trim().toLowerCase();
    const lista = texto ? nombresUnicos.filter((n) => n.toLowerCase().includes(texto)) : nombresUnicos;
    return lista.slice(0, 30);
  }, [nombresUnicos, campo]);

  const sugerenciasRecorrido = useMemo(() => {
    const nombreTexto = campo.trim().toLowerCase();
    const recorridoTexto = recorrido.trim().toLowerCase();
    const vistos = new Set<string>();
    const lista: string[] = [];
    for (const c of campos) {
      if (!nombreTexto || c.nombre.toLowerCase().includes(nombreTexto)) {
        if (!recorridoTexto || c.recorrido.toLowerCase().includes(recorridoTexto)) {
          if (!vistos.has(c.recorrido)) {
            vistos.add(c.recorrido);
            lista.push(c.recorrido);
          }
        }
      }
    }
    return lista.slice(0, 30);
  }, [campos, campo, recorrido]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function cerrarConRetraso() {
    // El retraso deja tiempo a que el onMouseDown de una opción se procese
    // antes de que el blur del input cierre la lista.
    timeoutRef.current = setTimeout(() => setListaAbierta(null), 150);
  }
  function cancelarCierre() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="relative">
        <label htmlFor="campo_golf" className="block text-sm font-medium text-ajag-verde-900">
          Campo de golf *
        </label>
        <input
          id="campo_golf"
          name="campo_golf"
          required
          value={campo}
          onChange={(e) => setCampo(e.target.value)}
          onFocus={() => {
            cancelarCierre();
            setListaAbierta("campo");
          }}
          onBlur={cerrarConRetraso}
          autoComplete="off"
          placeholder="Busca o escribe un campo nuevo"
          className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
        />
        {listaAbierta === "campo" && sugerenciasCampo.length > 0 ? (
          <ul
            onMouseDown={cancelarCierre}
            className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-ajag-gris-200 bg-white py-1 shadow-lg"
          >
            {sugerenciasCampo.map((nombre) => (
              <li key={nombre}>
                <button
                  type="button"
                  onClick={() => {
                    setCampo(nombre);
                    setListaAbierta(null);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-ajag-verde-900 hover:bg-ajag-verde-50"
                >
                  {nombre}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="relative">
        <label htmlFor="recorrido" className="block text-sm font-medium text-ajag-verde-900">
          Recorrido
        </label>
        <input
          id="recorrido"
          name="recorrido"
          value={recorrido}
          onChange={(e) => setRecorrido(e.target.value)}
          onFocus={() => {
            cancelarCierre();
            setListaAbierta("recorrido");
          }}
          onBlur={cerrarConRetraso}
          autoComplete="off"
          placeholder="Busca o escribe un recorrido nuevo"
          className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
        />
        {listaAbierta === "recorrido" && sugerenciasRecorrido.length > 0 ? (
          <ul
            onMouseDown={cancelarCierre}
            className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-ajag-gris-200 bg-white py-1 shadow-lg"
          >
            {sugerenciasRecorrido.map((r) => (
              <li key={r}>
                <button
                  type="button"
                  onClick={() => {
                    setRecorrido(r);
                    setListaAbierta(null);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-ajag-verde-900 hover:bg-ajag-verde-50"
                >
                  {r}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
