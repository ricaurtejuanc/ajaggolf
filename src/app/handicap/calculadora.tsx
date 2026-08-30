"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { guardarRonda, type EstadoGuardarRonda } from "./actions";
import { MODALIDADES, handicapDeJuego, resultadoDeRonda } from "@/lib/handicap/calculo";

const claseCampo =
  "mt-1 w-full rounded-xl border border-ajag-gris-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-ajag-verde-600";
const claseEtiqueta = "block text-sm font-medium text-ajag-verde-900";

// El hándicap del jugador se recuerda en su navegador: es el dato que se
// repite en cada visita y volver a teclearlo cada vez es la fricción más
// tonta de una calculadora así.
const CLAVE_HI = "aftergolf.handicapIndex";

// localStorage es un almacén externo a React, así que se lee con
// useSyncExternalStore y no con un efecto: el servidor renderiza vacío
// (instantánea de servidor) y el cliente adopta el valor guardado al
// hidratar, sin desajuste de hidratación ni un setState en cascada.
// No hay suscripción: el valor solo interesa al montar, porque a partir de
// ahí manda lo que teclee el jugador.
const sinSuscripcion = () => () => {};

function leerHiGuardado(): string {
  try {
    return localStorage.getItem(CLAVE_HI) ?? "";
  } catch {
    // Navegador con el almacenamiento bloqueado: se sigue sin recordar nada.
    return "";
  }
}

function Resultado({
  label,
  valor,
  nota,
  destacado,
}: {
  label: string;
  valor: string;
  nota?: string;
  destacado?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        destacado ? "border-ajag-oro-500 bg-ajag-oro-500/10" : "border-ajag-gris-200 bg-white"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-ajag-gris-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ajag-verde-900">{valor}</p>
      {nota ? <p className="mt-1 text-xs text-ajag-gris-500">{nota}</p> : null}
    </div>
  );
}

export function CalculadoraHandicap({ haySesion }: { haySesion: boolean }) {
  const [pestana, setPestana] = useState<"antes" | "despues">("antes");

  const hiGuardado = useSyncExternalStore(sinSuscripcion, leerHiGuardado, () => "");
  const [hiEditado, setHiEditado] = useState<string | null>(null);
  const hi = hiEditado ?? hiGuardado;

  function cambiarHi(valor: string) {
    setHiEditado(valor);
    try {
      localStorage.setItem(CLAVE_HI, valor.trim());
    } catch {
      // No poder recordarlo no debe romper la calculadora.
    }
  }

  const [modalidad, setModalidad] = useState(1);
  const [campo, setCampo] = useState("");
  const [recorrido, setRecorrido] = useState("");
  const [tee, setTee] = useState("");
  const [cr, setCr] = useState("");
  const [slope, setSlope] = useState("");
  const [par, setPar] = useState("72");
  const [bruto, setBruto] = useState("");
  const [pcc, setPcc] = useState("0");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));

  const [estado, accionGuardar, guardando] = useActionState<EstadoGuardarRonda, FormData>(
    guardarRonda,
    { ok: false, error: null },
  );

  const numero = (valor: string) => Number(valor.replace(",", "."));
  const nHi = numero(hi);
  const nCr = numero(cr);
  const nSlope = numero(slope);
  const nPar = numero(par);
  const nBruto = numero(bruto);

  const teeCompleto =
    [nCr, nSlope, nPar].every(Number.isFinite) && cr !== "" && slope !== "" && par !== "";
  const listoAntes = teeCompleto && hi !== "" && Number.isFinite(nHi);
  const listoDespues = listoAntes && bruto !== "" && Number.isFinite(nBruto);

  const teeObj = { cr: nCr, slope: nSlope, par: nPar };
  const hcp = listoAntes ? handicapDeJuego({ handicapIndex: nHi, tee: teeObj, modalidad }) : null;
  const ronda =
    listoDespues && hcp
      ? resultadoDeRonda({
          handicapJuego: hcp.handicapJuego,
          bruto: nBruto,
          tee: teeObj,
          pcc: numero(pcc) || 0,
        })
      : null;

  return (
    <div>
      <div className="flex gap-2">
        {(["antes", "despues"] as const).map((valor) => (
          <button
            key={valor}
            type="button"
            onClick={() => setPestana(valor)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              pestana === valor
                ? "bg-ajag-verde-700 text-white"
                : "border border-ajag-gris-200 text-ajag-verde-900 hover:bg-ajag-verde-50"
            }`}
          >
            {valor === "antes" ? "Antes de jugar" : "Después de jugar"}
          </button>
        ))}
      </div>

      <form action={accionGuardar} className="mt-4 flex flex-col gap-4">
        <div className="card-ajag p-5">
          <h2 className="font-display text-base font-semibold text-ajag-verde-900">
            El campo que juegas
          </h2>
          <p className="mt-0.5 text-sm text-ajag-gris-500">
            El Course Rating, el Slope y el par vienen en la tarjeta del campo, junto al color
            de cada barra.
          </p>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="campo" className={claseEtiqueta}>
                Campo
              </label>
              <input
                id="campo"
                name="campo"
                value={campo}
                onChange={(e) => setCampo(e.target.value)}
                placeholder="Ej. Real Club de Campo"
                className={claseCampo}
              />
            </div>
            <div>
              <label htmlFor="recorrido" className={claseEtiqueta}>
                Recorrido (opcional)
              </label>
              <input
                id="recorrido"
                name="recorrido"
                value={recorrido}
                onChange={(e) => setRecorrido(e.target.value)}
                className={claseCampo}
              />
            </div>
            <div>
              <label htmlFor="tee" className={claseEtiqueta}>
                Barras (opcional)
              </label>
              <input
                id="tee"
                name="tee"
                value={tee}
                onChange={(e) => setTee(e.target.value)}
                placeholder="Amarillas, rojas…"
                className={claseCampo}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="course_rating" className={claseEtiqueta}>
                  CR
                </label>
                <input
                  id="course_rating"
                  name="course_rating"
                  inputMode="decimal"
                  value={cr}
                  onChange={(e) => setCr(e.target.value)}
                  placeholder="71,4"
                  className={claseCampo}
                />
              </div>
              <div>
                <label htmlFor="slope_rating" className={claseEtiqueta}>
                  Slope
                </label>
                <input
                  id="slope_rating"
                  name="slope_rating"
                  inputMode="numeric"
                  value={slope}
                  onChange={(e) => setSlope(e.target.value)}
                  placeholder="128"
                  className={claseCampo}
                />
              </div>
              <div>
                <label htmlFor="par" className={claseEtiqueta}>
                  Par
                </label>
                <input
                  id="par"
                  name="par"
                  inputMode="numeric"
                  value={par}
                  onChange={(e) => setPar(e.target.value)}
                  className={claseCampo}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card-ajag p-5">
          <h2 className="font-display text-base font-semibold text-ajag-verde-900">
            {pestana === "antes" ? "Tu hándicap" : "Tu ronda"}
          </h2>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="handicap_index" className={claseEtiqueta}>
                Hándicap Index (HI)
              </label>
              <input
                id="handicap_index"
                name="handicap_index"
                inputMode="decimal"
                value={hi}
                onChange={(e) => cambiarHi(e.target.value)}
                placeholder="18,4"
                className={claseCampo}
              />
            </div>
            <div>
              <label htmlFor="modalidad" className={claseEtiqueta}>
                Modalidad
              </label>
              <select
                id="modalidad"
                name="modalidad"
                value={modalidad}
                onChange={(e) => setModalidad(Number(e.target.value))}
                className={claseCampo}
              >
                {MODALIDADES.map((m) => (
                  <option key={m.valor} value={m.valor}>
                    {m.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            {pestana === "despues" ? (
              <>
                <div>
                  <label htmlFor="bruto" className={claseEtiqueta}>
                    Resultado bruto
                  </label>
                  <input
                    id="bruto"
                    name="bruto"
                    inputMode="numeric"
                    value={bruto}
                    onChange={(e) => setBruto(e.target.value)}
                    placeholder="95"
                    className={claseCampo}
                  />
                  <p className="mt-1 text-xs text-ajag-gris-500">
                    Con tope de doble bogey por hoyo: un desastre puntual no te dispara el
                    resultado.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="pcc" className={claseEtiqueta}>
                      Ajuste PCC
                    </label>
                    <input
                      id="pcc"
                      name="pcc"
                      inputMode="numeric"
                      value={pcc}
                      onChange={(e) => setPcc(e.target.value)}
                      className={claseCampo}
                    />
                    <p className="mt-1 text-xs text-ajag-gris-500">
                      Normalmente 0; solo si el club lo comunica.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="fecha" className={claseEtiqueta}>
                      Fecha
                    </label>
                    <input
                      id="fecha"
                      name="fecha"
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className={claseCampo}
                    />
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {pestana === "antes" ? (
          hcp ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Resultado
                label="Hándicap de juego"
                valor={String(hcp.handicapJuego)}
                nota={`Valor exacto ${hcp.exacto.toFixed(2)}`}
                destacado
              />
              <Resultado
                label="Golpes por hoyo"
                valor={
                  hcp.handicapJuego <= 0
                    ? "Juegas scratch"
                    : hcp.handicapJuego <= 18
                      ? `1 golpe en los ${hcp.handicapJuego} hoyos más difíciles`
                      : `1 en todos y 2 en los ${hcp.handicapJuego % 18} más difíciles`
                }
                nota="Según el índice de hándicap de cada hoyo en la tarjeta."
              />
            </div>
          ) : (
            <div className="card-ajag p-6 text-center text-sm text-ajag-gris-500">
              Rellena tu hándicap y los datos del tee para ver tus golpes de ventaja.
            </div>
          )
        ) : ronda && hcp ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Resultado label="Hcp de juego" valor={String(hcp.handicapJuego)} />
              <Resultado label="Resultado neto" valor={String(ronda.neto)} />
              <Resultado label="Puntos Stableford" valor={String(ronda.puntosStableford)} />
              <Resultado
                label="Score Differential"
                valor={ronda.differential.toFixed(1)}
                nota="(113 / Slope) × (Bruto − CR − PCC)"
                destacado
              />
            </div>

            <div className="card-ajag flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <p className="font-display text-base font-semibold text-ajag-verde-900">
                  Guardar esta ronda
                </p>
                <p className="mt-0.5 text-sm text-ajag-gris-500">
                  {haySesion
                    ? "Se añade a tu historial en Mi cuenta, con su Score Differential."
                    : "Necesitas iniciar sesión para llevar el historial de tus rondas."}
                </p>
                {estado.error ? (
                  <p className="mt-2 text-sm text-ajag-rojo-600">{estado.error}</p>
                ) : null}
                {estado.ok ? (
                  <p className="mt-2 text-sm font-medium text-ajag-verde-700">
                    Ronda guardada.{" "}
                    <Link href="/cuenta" className="underline">
                      Ver mi historial
                    </Link>
                  </p>
                ) : null}
              </div>

              {haySesion ? (
                <button
                  type="submit"
                  disabled={guardando}
                  className="shrink-0 rounded-xl bg-ajag-verde-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
                >
                  {guardando ? "Guardando..." : "Guardar ronda"}
                </button>
              ) : (
                <Link
                  href="/login?next=/handicap"
                  className="shrink-0 rounded-xl bg-ajag-verde-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ajag-verde-600"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>
          </>
        ) : (
          <div className="card-ajag p-6 text-center text-sm text-ajag-gris-500">
            Añade tu resultado bruto para ver el neto, los puntos Stableford y el differential.
          </div>
        )}
      </form>
    </div>
  );
}
