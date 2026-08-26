"use client";

import { useActionState, useRef, useState } from "react";
import { Download, Plus, Upload, X } from "lucide-react";
import { guardarResultados } from "./actions";
import { filaVacia, type EstadoJuego, type FilaResultado } from "./fila-resultado";
import type { FormatoPuntuacion } from "@/types/database";

const ETIQUETA_ESTADO: Record<EstadoJuego, string> = {
  "": "Normal",
  retirado: "Retirado",
  no_presentado: "No presentado",
};

function estadoDesdeTexto(texto: string): EstadoJuego {
  const normalizado = texto.trim().toLowerCase();
  if (normalizado === "retirado") return "retirado";
  if (normalizado === "no presentado" || normalizado === "no_presentado") return "no_presentado";
  return "";
}

export interface CategoriaClasificacion {
  nombre: string;
  handicapDesde: number | null;
  handicapHasta: number | null;
}

export function ResultadosForm({
  torneoId,
  formatoPuntuacion,
  filasIniciales,
  categorias = [],
}: {
  torneoId: string;
  formatoPuntuacion: FormatoPuntuacion;
  filasIniciales: FilaResultado[];
  categorias?: CategoriaClasificacion[];
}) {
  const [filas, setFilas] = useState<FilaResultado[]>(
    filasIniciales.length > 0 ? filasIniciales : [filaVacia()],
  );
  const [mensajeXls, setMensajeXls] = useState<string | null>(null);
  const inputXlsRef = useRef<HTMLInputElement>(null);

  const guardarBorrador = guardarResultados.bind(null, torneoId, false);
  const publicarResultados = guardarResultados.bind(null, torneoId, true);

  const [estadoBorrador, dispatchBorrador, pendingBorrador] = useActionState(guardarBorrador, {
    ok: false,
    error: null,
  });
  const [estadoPublicar, dispatchPublicar, pendingPublicar] = useActionState(
    publicarResultados,
    { ok: false, error: null },
  );

  function actualizarFila(key: number, campo: keyof FilaResultado, valor: string) {
    setFilas((prev) => prev.map((f) => (f.key === key ? { ...f, [campo]: valor } : f)));
  }

  const columnaPrincipal = formatoPuntuacion === "stableford" ? "puntos" : "golpes";
  const nombreColumnaXls = columnaPrincipal === "puntos" ? "puntos Stableford" : "golpes";

  // Calcula la posición de cada jugador dentro de su categoría (si hay
  // categorías configuradas; si no, de todos juntos) a partir de su
  // puntuación: más puntos stableford primero, menos golpes primero en el
  // resto de formatos. En caso de empate en puntuación decide el hándicap:
  // el más bajo gana en stableford, el más alto gana en el resto de
  // formatos. Solo un empate exacto (misma puntuación y mismo hándicap)
  // comparte posición. Retirados, no presentados o sin puntuación todavía
  // se quedan sin posición.
  function generarClasificacion() {
    const stableford = columnaPrincipal === "puntos";

    const grupos = new Map<string, FilaResultado[]>();
    for (const f of filas) {
      const nombreGrupo = categorias.length > 0 ? categoriaDeFila(f) : "";
      const grupo = grupos.get(nombreGrupo);
      if (grupo) grupo.push(f);
      else grupos.set(nombreGrupo, [f]);
    }

    const posicionPorKey = new Map<number, number>();

    for (const grupo of grupos.values()) {
      const clasificables = grupo
        .map((f) => {
          const hcpRaw = parseFloat(f.handicap.replace(",", "."));
          return {
            fila: f,
            valor: parseFloat(f[columnaPrincipal].replace(",", ".")),
            handicap: Number.isNaN(hcpRaw) ? null : hcpRaw,
          };
        })
        .filter((f) => f.fila.estadoJuego === "" && !Number.isNaN(f.valor));

      clasificables.sort((a, b) => {
        const diferencia = stableford ? b.valor - a.valor : a.valor - b.valor;
        if (diferencia !== 0) return diferencia;
        // Sin hándicap conocido, pierde el desempate frente a quien sí lo
        // tiene (no se puede aplicar la regla sin ese dato).
        const hcpA = a.handicap ?? (stableford ? Infinity : -Infinity);
        const hcpB = b.handicap ?? (stableford ? Infinity : -Infinity);
        return stableford ? hcpA - hcpB : hcpB - hcpA;
      });

      let posicionActual = 0;
      let valorAnterior: number | null = null;
      let handicapAnterior: number | null = null;
      clasificables.forEach((c, indice) => {
        const empatado = valorAnterior === c.valor && handicapAnterior === c.handicap;
        if (!empatado) {
          posicionActual = indice + 1;
          valorAnterior = c.valor;
          handicapAnterior = c.handicap;
        }
        posicionPorKey.set(c.fila.key, posicionActual);
      });
    }

    setFilas((prev) =>
      prev.map((f) => ({
        ...f,
        posicion: posicionPorKey.has(f.key) ? String(posicionPorKey.get(f.key)) : "",
      })),
    );
  }

  function categoriaDeFila(fila: FilaResultado): string {
    const hcp = parseFloat(fila.handicap.replace(",", "."));
    if (Number.isNaN(hcp)) return "Sin categoría asignada";

    const conRango = categorias.filter((c) => c.handicapDesde != null || c.handicapHasta != null);
    if (conRango.length === 0) return "Sin categoría asignada";

    const exacta = conRango.find(
      (c) =>
        (c.handicapDesde == null || hcp >= c.handicapDesde) &&
        (c.handicapHasta == null || hcp <= c.handicapHasta),
    );
    if (exacta) return exacta.nombre;

    // Ningún tramo cubre este hándicap (hueco entre categorías, o por
    // encima/debajo de todas): en vez de dejar al jugador sin categoría, se
    // asigna a la más cercana. Un mal ajuste de rangos en el torneo no debe
    // dejar a nadie fuera de la tabla.
    let masCercana = conRango[0];
    let distanciaMinima = Infinity;
    for (const c of conRango) {
      const distDesde = c.handicapDesde != null ? Math.abs(hcp - c.handicapDesde) : Infinity;
      const distHasta = c.handicapHasta != null ? Math.abs(hcp - c.handicapHasta) : Infinity;
      const distancia = Math.min(distDesde, distHasta);
      if (distancia < distanciaMinima) {
        distanciaMinima = distancia;
        masCercana = c;
      }
    }
    return masCercana.nombre;
  }

  // Exporta la tabla actual a un XLS para rellenarlo fuera de la app (ej.
  // en el campo, sin buena conexión) y volver a subirlo con "Subir XLS".
  async function descargarXls() {
    const XLSX = await import("xlsx");
    const datos = filas.map((fila) => ({
      id_torneo: torneoId,
      posición: fila.posicion,
      categoría: categorias.length > 0 ? categoriaDeFila(fila) : "Categoría única",
      nombre: fila.nombreMostrado,
      licencia: fila.licenciaFederativa,
      handicap: fila.handicap,
      [nombreColumnaXls]: fila[columnaPrincipal],
      estado: ETIQUETA_ESTADO[fila.estadoJuego],
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Resultados");
    XLSX.writeFile(libro, `resultados-${torneoId}.xlsx`);
  }

  // Sube un XLS (descargado con "Descargar XLS" y rellenado, o hecho a
  // mano con las mismas columnas) y actualiza la tabla: las filas que
  // coinciden por licencia se actualizan, las que no existen se añaden.
  // No se borra ninguna fila que no aparezca en el archivo.
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
          const idTorneoFila = leerTexto(filaXls, "id_torneo");
          if (idTorneoFila && idTorneoFila !== torneoId) idsDistintos = true;

          const licencia = leerTexto(filaXls, "licencia");
          const nombre = leerTexto(filaXls, "nombre");
          const handicap = leerTexto(filaXls, "handicap");
          const puntos = leerTexto(filaXls, nombreColumnaXls);
          const posicion = leerTexto(filaXls, "posición", "posicion");
          const estadoTexto = leerTexto(filaXls, "estado");
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
              handicap: handicap || siguiente[indiceExistente].handicap,
              [columnaPrincipal]: puntos || siguiente[indiceExistente][columnaPrincipal],
              posicion: posicion || siguiente[indiceExistente].posicion,
              estadoJuego: estadoTexto
                ? estadoDesdeTexto(estadoTexto)
                : siguiente[indiceExistente].estadoJuego,
            };
            actualizadas++;
          } else {
            siguiente.push(
              filaVacia({
                nombreMostrado: nombre,
                licenciaFederativa: licencia,
                handicap,
                [columnaPrincipal]: puntos,
                posicion,
                estadoJuego: estadoDesdeTexto(estadoTexto),
              }),
            );
            anadidas++;
          }
        }
        // Tras importar, la tabla se reordena por posición ascendente (sin
        // posición asignada, o no numérica, va al final).
        siguiente.sort((a, b) => {
          const posA = parseInt(a.posicion, 10);
          const posB = parseInt(b.posicion, 10);
          const valorA = Number.isNaN(posA) ? Infinity : posA;
          const valorB = Number.isNaN(posB) ? Infinity : posB;
          return valorA - valorB;
        });
        return siguiente;
      });

      const avisoTorneo = idsDistintos
        ? " Ojo: alguna fila del archivo tenía un id_torneo distinto al de este torneo."
        : "";
      setMensajeXls(
        `Actualizado desde el XLS: ${actualizadas} fila(s) actualizada(s), ${anadidas} nueva(s).${avisoTorneo}`,
      );
    } catch (err) {
      setMensajeXls(
        `No se pudo leer el archivo: ${err instanceof Error ? err.message : "formato no reconocido"}.`,
      );
    }
  }

  // Si el torneo tiene categorías reales por hándicap, se reparten las
  // filas en una tabla por categoría (más fácil de rellenar y de leer que
  // una lista plana con todos los inscritos); si no, va todo en una tabla.
  const grupos: { nombre: string; filas: FilaResultado[] }[] =
    categorias.length === 0
      ? [{ nombre: "", filas }]
      : Object.entries(
          filas.reduce<Record<string, FilaResultado[]>>((acc, fila) => {
            const nombre = categoriaDeFila(fila);
            (acc[nombre] ??= []).push(fila);
            return acc;
          }, {}),
        )
          .map(([nombre, filasGrupo]) => ({ nombre, filas: filasGrupo }))
          .sort((a, b) => {
            const ia = categorias.findIndex((c) => c.nombre === a.nombre);
            const ib = categorias.findIndex((c) => c.nombre === b.nombre);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
          });

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
      </div>
      <p className="-mt-3 text-xs text-ajag-gris-500">
        &quot;Descargar XLS&quot; exporta la tabla actual (id_torneo, posición, categoría —
        &quot;Categoría única&quot; si el torneo no tiene tramos de hándicap —, nombre, licencia,
        handicap, {nombreColumnaXls}, estado) para rellenarla fuera de la app; &quot;Subir
        XLS&quot; vuelve a leerla y actualiza cada fila por licencia (añade las que no
        existan todavía). Deja una celda en blanco para no tocar ese dato al subirlo.
      </p>
      {mensajeXls ? <p className="-mt-3 text-xs text-ajag-verde-700">{mensajeXls}</p> : null}

      {grupos.map((grupo) => (
        <div key={grupo.nombre || "todos"}>
          {grupo.nombre ? (
            <p className="mb-2 text-sm font-medium text-ajag-verde-900">{grupo.nombre}</p>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-ajag-gris-100 text-xs uppercase text-ajag-gris-500">
                <tr>
                  <th className="py-2 pr-2">Pos.</th>
                  <th className="py-2 pr-2">Jugador</th>
                  <th className="py-2 pr-2">Licencia</th>
                  <th className="py-2 pr-2">Hcp</th>
                  <th className="py-2 pr-2">
                    {columnaPrincipal === "puntos" ? "Puntos" : "Golpes"}
                  </th>
                  <th className="py-2 pr-2">Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {grupo.filas.map((fila) => (
                  <tr key={fila.key} className="border-b border-ajag-gris-100 last:border-0">
                    <td className="py-1.5 pr-2">
                      <input
                        name="posicion"
                        type="number"
                        min={1}
                        value={fila.posicion}
                        onChange={(e) => actualizarFila(fila.key, "posicion", e.target.value)}
                        className="w-16 rounded-lg border border-ajag-gris-200 px-2 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        name="nombre_mostrado"
                        value={fila.nombreMostrado}
                        onChange={(e) =>
                          actualizarFila(fila.key, "nombreMostrado", e.target.value)
                        }
                        required
                        className="w-full min-w-[10rem] rounded-lg border border-ajag-gris-200 px-2 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                      />
                      <input
                        type="hidden"
                        name="inscripcion_id"
                        value={fila.inscripcionId ?? ""}
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        name="licencia_federativa"
                        value={fila.licenciaFederativa}
                        onChange={(e) =>
                          actualizarFila(fila.key, "licenciaFederativa", e.target.value)
                        }
                        className="w-28 rounded-lg border border-ajag-gris-200 px-2 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        name="handicap"
                        type="number"
                        step="0.1"
                        value={fila.handicap}
                        onChange={(e) => actualizarFila(fila.key, "handicap", e.target.value)}
                        className="w-16 rounded-lg border border-ajag-gris-200 px-2 py-1.5 text-sm outline-none focus:border-ajag-verde-600"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        name={columnaPrincipal}
                        type="number"
                        step="0.1"
                        value={fila[columnaPrincipal]}
                        readOnly={fila.estadoJuego !== ""}
                        onChange={(e) => actualizarFila(fila.key, columnaPrincipal, e.target.value)}
                        className="w-20 rounded-lg border border-ajag-gris-200 px-2 py-1.5 text-sm outline-none focus:border-ajag-verde-600 read-only:bg-ajag-gris-100"
                      />
                      <input
                        type="hidden"
                        name={columnaPrincipal === "puntos" ? "golpes" : "puntos"}
                        value=""
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <select
                        name="estado_juego"
                        value={fila.estadoJuego}
                        onChange={(e) => {
                          const nuevoEstado = e.target.value as FilaResultado["estadoJuego"];
                          setFilas((prev) =>
                            prev.map((f) => {
                              if (f.key !== fila.key) return f;
                              // Un retirado/no presentado no ha completado la
                              // vuelta: en stableford eso son 0 puntos (en
                              // golpes no hay un equivalente sensato, se deja
                              // en blanco). Al volver a "Normal" se limpia el
                              // 0 puesto automáticamente para no dejarlo
                              // colado si era un valor real.
                              const puntosForzados =
                                nuevoEstado !== "" && columnaPrincipal === "puntos" ? "0" : f.puntos;
                              const puntosLimpios =
                                nuevoEstado === "" && f.puntos === "0" ? "" : puntosForzados;
                              return { ...f, estadoJuego: nuevoEstado, puntos: puntosLimpios };
                            }),
                          );
                        }}
                        className="rounded-lg border border-ajag-gris-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-ajag-verde-600"
                      >
                        <option value="">Normal</option>
                        <option value="retirado">Retirado</option>
                        <option value="no_presentado">No presentado</option>
                      </select>
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
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => setFilas((prev) => [...prev, filaVacia()])}
          className="flex w-fit items-center gap-1 text-sm font-medium text-ajag-verde-700 hover:underline"
        >
          <Plus size={16} /> Añadir fila
        </button>
        <button
          type="button"
          onClick={generarClasificacion}
          className="flex w-fit items-center gap-1.5 rounded-full bg-ajag-oro-500/20 px-3 py-1.5 text-sm font-medium text-ajag-oro-600 hover:bg-ajag-oro-500/30"
        >
          Generar clasificación
        </button>
      </div>
      <p className="-mt-3 text-xs text-ajag-gris-500">
        Calcula la posición dentro de cada categoría a partir de{" "}
        {columnaPrincipal === "puntos" ? "los puntos" : "los golpes"}; en empates gana el
        hándicap {columnaPrincipal === "puntos" ? "más bajo" : "más alto"}. Los retirados, no
        presentados o sin puntuación quedan sin posición. Revisa antes de guardar.
      </p>

      {estadoBorrador.error ? (
        <p className="text-sm text-ajag-rojo-600">{estadoBorrador.error}</p>
      ) : null}
      {estadoPublicar.error ? (
        <p className="text-sm text-ajag-rojo-600">{estadoPublicar.error}</p>
      ) : null}
      {estadoBorrador.ok ? (
        <p className="text-sm text-ajag-verde-700">Borrador guardado.</p>
      ) : null}
      {estadoPublicar.ok ? (
        <p className="text-sm text-ajag-verde-700">Clasificación publicada.</p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          formAction={dispatchBorrador}
          disabled={pendingBorrador || pendingPublicar}
          className="rounded-xl border border-ajag-verde-700 px-5 py-2.5 text-sm font-medium text-ajag-verde-700 transition hover:bg-ajag-verde-50 disabled:opacity-60"
        >
          {pendingBorrador ? "Guardando..." : "Guardar borrador"}
        </button>
        <button
          type="submit"
          formAction={dispatchPublicar}
          disabled={pendingBorrador || pendingPublicar}
          className="rounded-xl bg-ajag-verde-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
        >
          {pendingPublicar ? "Publicando..." : "Publicar clasificación"}
        </button>
      </div>
    </form>
  );
}
