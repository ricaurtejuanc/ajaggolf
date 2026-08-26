"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Download, Plus, RefreshCw, Upload, X } from "lucide-react";
import { guardarClasificacionLiga, recalcularClasificacionLiga } from "./actions";
import { filaVacia, type FilaClasificacion } from "./fila-clasificacion";

export function ClasificacionLigaAdminForm({
  ligaId,
  filasIniciales,
  etiquetaPuntos,
}: {
  ligaId: string;
  filasIniciales: FilaClasificacion[];
  etiquetaPuntos: string;
}) {
  const [filas, setFilas] = useState<FilaClasificacion[]>(
    filasIniciales.length > 0 ? filasIniciales : [filaVacia()],
  );
  const [mensajeXls, setMensajeXls] = useState<string | null>(null);
  const inputXlsRef = useRef<HTMLInputElement>(null);
  const [recalculando, iniciarRecalculo] = useTransition();
  const [mensajeRecalculo, setMensajeRecalculo] = useState<string | null>(null);

  const guardar = guardarClasificacionLiga.bind(null, ligaId);
  const [estadoGuardar, dispatchGuardar, pendingGuardar] = useActionState(guardar, {
    ok: false,
    error: null,
  });

  function actualizarFila(key: number, campo: keyof FilaClasificacion, valor: string) {
    setFilas((prev) => prev.map((f) => (f.key === key ? { ...f, [campo]: valor } : f)));
  }

  async function descargarXls() {
    const XLSX = await import("xlsx");
    const datos = filas.map((fila) => ({
      Id_Liga: ligaId,
      nombre: fila.nombreMostrado,
      licencia: fila.licenciaFederativa,
      [etiquetaPuntos]: fila.puntosTotales,
      "pruebas jugadas": fila.eventosJugados,
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Clasificación");
    XLSX.writeFile(libro, `clasificacion-liga-${ligaId}.xlsx`);
  }

  async function subirXls(archivo: File) {
    setMensajeXls(null);
    try {
      const XLSX = await import("xlsx");
      const buffer = await archivo.arrayBuffer();
      const libro = XLSX.read(buffer, { type: "array" });
      const hoja = libro.Sheets[libro.SheetNames[0]];
      if (!hoja) throw new Error("El archivo no tiene ninguna hoja.");
      const filasXls = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja);

      const leerTexto = (fila: Record<string, unknown>, ...claves: string[]) => {
        for (const clave of claves) {
          const valor = fila[clave];
          if (valor != null && String(valor).trim() !== "") return String(valor).trim();
        }
        return "";
      };

      let idsDistintos = false;
      let actualizadas = 0;
      let anadidas = 0;

      setFilas((prev) => {
        const siguiente = [...prev];
        for (const filaXls of filasXls) {
          const idLigaFila = leerTexto(filaXls, "Id_Liga", "id_liga");
          if (idLigaFila && idLigaFila !== ligaId) idsDistintos = true;

          const licencia = leerTexto(filaXls, "licencia", "licencia_federativa");
          const nombre = leerTexto(filaXls, "nombre");
          const puntos = leerTexto(filaXls, etiquetaPuntos, "puntos_totales", "puntos totales", "puntos");
          const eventos = leerTexto(
            filaXls,
            "pruebas jugadas",
            "pruebas_jugadas",
            "eventos_jugados",
            "eventos jugados",
          );
          if (!licencia && !nombre) continue;

          const indiceExistente = licencia
            ? siguiente.findIndex(
                (f) => f.licenciaFederativa.trim().toUpperCase() === licencia.toUpperCase(),
              )
            : -1;

          if (indiceExistente !== -1) {
            siguiente[indiceExistente] = {
              ...siguiente[indiceExistente],
              nombreMostrado: nombre || siguiente[indiceExistente].nombreMostrado,
              puntosTotales: puntos || siguiente[indiceExistente].puntosTotales,
              eventosJugados: eventos || siguiente[indiceExistente].eventosJugados,
            };
            actualizadas++;
          } else {
            siguiente.push(
              filaVacia({
                nombreMostrado: nombre,
                licenciaFederativa: licencia,
                puntosTotales: puntos || "0",
                eventosJugados: eventos || "0",
              }),
            );
            anadidas++;
          }
        }
        // Tras importar, se reordena por puntos totales descendente.
        siguiente.sort((a, b) => {
          const puntosA = parseFloat(a.puntosTotales.replace(",", "."));
          const puntosB = parseFloat(b.puntosTotales.replace(",", "."));
          return (Number.isNaN(puntosB) ? 0 : puntosB) - (Number.isNaN(puntosA) ? 0 : puntosA);
        });
        return siguiente;
      });

      const avisoLiga = idsDistintos
        ? " Ojo: alguna fila del archivo tenía un Id_Liga distinto al de esta liga."
        : "";
      setMensajeXls(
        `Actualizado desde el XLS: ${actualizadas} fila(s) actualizada(s), ${anadidas} nueva(s).${avisoLiga}`,
      );
    } catch (err) {
      setMensajeXls(
        `No se pudo leer el archivo: ${err instanceof Error ? err.message : "formato no reconocido"}.`,
      );
    }
  }

  function recalcular() {
    if (
      !confirm(
        "Esto va a recalcular la clasificación desde los resultados publicados de los torneos de esta liga y descartará cualquier cambio manual sin guardar. ¿Continuar?",
      )
    ) {
      return;
    }
    setMensajeRecalculo(null);
    iniciarRecalculo(async () => {
      const resultado = await recalcularClasificacionLiga(ligaId);
      setMensajeRecalculo(
        resultado.ok
          ? "Clasificación recalculada desde los resultados. Recarga la página para verla."
          : (resultado.error ?? "No se pudo recalcular."),
      );
    });
  }

  return (
    <form className="card-ajag flex flex-col gap-5 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={descargarXls}
          className="flex w-fit items-center gap-1.5 rounded-full border border-ajag-verde-700 px-3 py-1.5 text-sm font-medium text-ajag-verde-700 hover:bg-ajag-verde-50"
        >
          <Download size={15} /> Descargar XLS
        </button>
        <button
          type="button"
          onClick={() => inputXlsRef.current?.click()}
          className="flex w-fit items-center gap-1.5 rounded-full border border-ajag-verde-700 px-3 py-1.5 text-sm font-medium text-ajag-verde-700 hover:bg-ajag-verde-50"
        >
          <Upload size={15} /> Subir XLS
        </button>
        <input
          ref={inputXlsRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            if (archivo) subirXls(archivo);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={recalcular}
          disabled={recalculando}
          className="flex w-fit items-center gap-1.5 rounded-full bg-ajag-oro-500/20 px-3 py-1.5 text-sm font-medium text-ajag-oro-600 hover:bg-ajag-oro-500/30 disabled:opacity-60"
        >
          <RefreshCw size={15} /> {recalculando ? "Recalculando..." : "Recalcular desde resultados"}
        </button>
      </div>
      <p className="-mt-3 text-xs text-ajag-gris-500">
        &quot;Descargar XLS&quot; exporta la tabla actual (Id_Liga, nombre, licencia,{" "}
        {etiquetaPuntos.toLowerCase()}, pruebas jugadas); &quot;Subir XLS&quot; vuelve a leerla
        y actualiza cada fila por licencia (añade las que no existan todavía).
      </p>
      {mensajeXls ? <p className="-mt-3 text-xs text-ajag-verde-700">{mensajeXls}</p> : null}
      {mensajeRecalculo ? <p className="-mt-3 text-xs text-ajag-verde-700">{mensajeRecalculo}</p> : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-ajag-gris-100 text-xs uppercase text-ajag-gris-500">
            <tr>
              <th className="py-2 pr-2">Jugador</th>
              <th className="py-2 pr-2">Licencia</th>
              <th className="py-2 pr-2">{etiquetaPuntos}</th>
              <th className="py-2 pr-2">Pruebas jugadas</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.key} className="border-b border-ajag-gris-100 last:border-0">
                <td className="py-1.5 pr-2">
                  <input
                    name="nombre"
                    value={fila.nombreMostrado}
                    onChange={(e) => actualizarFila(fila.key, "nombreMostrado", e.target.value)}
                    required
                    className="w-full min-w-[10rem] rounded-lg border border-ajag-gris-200 px-2 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    name="licencia"
                    value={fila.licenciaFederativa}
                    onChange={(e) => actualizarFila(fila.key, "licenciaFederativa", e.target.value)}
                    required
                    className="w-28 rounded-lg border border-ajag-gris-200 px-2 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    name="puntos_totales"
                    type="number"
                    step="0.1"
                    value={fila.puntosTotales}
                    onChange={(e) => actualizarFila(fila.key, "puntosTotales", e.target.value)}
                    className="w-24 rounded-lg border border-ajag-gris-200 px-2 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    name="eventos_jugados"
                    type="number"
                    min={0}
                    value={fila.eventosJugados}
                    onChange={(e) => actualizarFila(fila.key, "eventosJugados", e.target.value)}
                    className="w-20 rounded-lg border border-ajag-gris-200 px-2 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                  />
                </td>
                <td className="py-1.5">
                  <button
                    type="button"
                    aria-label="Quitar fila"
                    onClick={() => setFilas((prev) => prev.filter((f) => f.key !== fila.key))}
                    className="text-ajag-gris-500 hover:text-ajag-rojo-600"
                  >
                    <X size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={() => setFilas((prev) => [...prev, filaVacia()])}
        className="flex w-fit items-center gap-1 text-sm font-medium text-ajag-verde-700 hover:underline"
      >
        <Plus size={16} /> Añadir fila
      </button>

      {estadoGuardar.error ? <p className="text-sm text-ajag-rojo-600">{estadoGuardar.error}</p> : null}
      {estadoGuardar.ok ? <p className="text-sm text-ajag-verde-700">Clasificación guardada.</p> : null}

      <div className="flex gap-3">
        <button
          type="submit"
          formAction={dispatchGuardar}
          disabled={pendingGuardar}
          className="rounded-xl bg-ajag-verde-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
        >
          {pendingGuardar ? "Guardando..." : "Guardar clasificación"}
        </button>
      </div>
    </form>
  );
}
