"use client";

import { useMemo, useState } from "react";

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

  const recorridosSugeridos = useMemo(() => {
    const texto = campo.trim().toLowerCase();
    if (!texto) return [];
    const vistos = new Set<string>();
    const lista: string[] = [];
    for (const c of campos) {
      if (c.nombre.toLowerCase().includes(texto) && !vistos.has(c.recorrido)) {
        vistos.add(c.recorrido);
        lista.push(c.recorrido);
      }
    }
    return lista;
  }, [campos, campo]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="campo_golf" className="block text-sm font-medium text-ajag-verde-900">
          Campo de golf *
        </label>
        <input
          id="campo_golf"
          name="campo_golf"
          required
          list="campos-golf-nombres"
          value={campo}
          onChange={(e) => setCampo(e.target.value)}
          autoComplete="off"
          placeholder="Busca o escribe un campo nuevo"
          className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
        />
        <datalist id="campos-golf-nombres">
          {nombresUnicos.map((nombre) => (
            <option key={nombre} value={nombre} />
          ))}
        </datalist>
      </div>

      <div>
        <label htmlFor="recorrido" className="block text-sm font-medium text-ajag-verde-900">
          Recorrido
        </label>
        <input
          id="recorrido"
          name="recorrido"
          list="campos-golf-recorridos"
          defaultValue={recorridoInicial ?? ""}
          autoComplete="off"
          placeholder="Busca o escribe un recorrido nuevo"
          className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600"
        />
        <datalist id="campos-golf-recorridos">
          {recorridosSugeridos.map((recorrido) => (
            <option key={recorrido} value={recorrido} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
