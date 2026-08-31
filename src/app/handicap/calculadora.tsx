"use client";

import { useActionState, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { guardarRonda, type EstadoGuardarRonda } from "./actions";
import { MODALIDADES, handicapDeJuego, resultadoDeRonda } from "@/lib/handicap/calculo";
import type { TeeCatalogo } from "@/lib/data/campos-tees";
import { colorDeBarra } from "@/lib/tee-color";
import { HoyosConGolpe } from "./hoyos-con-golpe";
import { TarjetaModal } from "./tarjeta-modal";

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

export function CalculadoraHandicap({
  haySesion,
  catalogo,
}: {
  haySesion: boolean;
  catalogo: TeeCatalogo[];
}) {
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
  // El catálogo de la federación cubre Madrid y Andalucía; para cualquier
  // otro campo se sigue pudiendo teclear la valoración a mano.
  const [manual, setManual] = useState(false);
  const [teeId, setTeeId] = useState("");
  const [recorridoSel, setRecorridoSel] = useState("");
  const [verHoyos, setVerHoyos] = useState(false);
  const [verTarjeta, setVerTarjeta] = useState(false);

  const [campo, setCampo] = useState("");
  const [recorrido, setRecorrido] = useState("");
  const [tee, setTee] = useState("");
  const [cr, setCr] = useState("");
  const [slope, setSlope] = useState("");
  const [par, setPar] = useState("72");

  // Paso 1 del buscador: club elegido (o "" mientras se está buscando).
  const [clubSel, setClubSel] = useState("");
  const [busquedaClub, setBusquedaClub] = useState("");

  const clubes = useMemo(() => {
    const vistos = new Set<string>();
    for (const t of catalogo) vistos.add(t.club);
    return [...vistos].sort((a, b) => a.localeCompare(b, "es"));
  }, [catalogo]);

  const clubesFiltrados = useMemo(() => {
    const texto = busquedaClub.trim().toLowerCase();
    if (!texto) return [];
    return clubes.filter((c) => c.toLowerCase().includes(texto)).slice(0, 8);
  }, [clubes, busquedaClub]);

  const recorridos = useMemo(() => {
    const vistos = new Map<string, string>();
    for (const t of catalogo) vistos.set(`${t.club} · ${t.recorrido}`, t.recorrido);
    return [...vistos.keys()].sort((a, b) => a.localeCompare(b, "es"));
  }, [catalogo]);

  // Paso 2: recorridos del club elegido (solo el nombre del recorrido, sin
  // repetir el club delante — ya se sabe cuál es).
  const recorridosDelClub = useMemo(() => {
    const vistos = new Set<string>();
    for (const t of catalogo) if (t.club === clubSel) vistos.add(t.recorrido);
    return [...vistos].sort((a, b) => a.localeCompare(b, "es"));
  }, [catalogo, clubSel]);

  function elegirClub(club: string) {
    setClubSel(club);
    setBusquedaClub("");
    setTeeId("");
    // Con un solo recorrido no tiene sentido obligar a elegirlo: se
    // preselecciona directamente al elegir el club.
    const recorridosDeEsteClub = [
      ...new Set(catalogo.filter((t) => t.club === club).map((t) => t.recorrido)),
    ];
    setRecorridoSel(recorridosDeEsteClub.length === 1 ? `${club} · ${recorridosDeEsteClub[0]}` : "");
  }

  function cambiarClub() {
    setClubSel("");
    setBusquedaClub("");
    setRecorridoSel("");
    setTeeId("");
  }

  const barrasDelRecorrido = useMemo(
    () => catalogo.filter((t) => `${t.club} · ${t.recorrido}` === recorridoSel),
    [catalogo, recorridoSel],
  );

  // Elegir barra rellena CR/slope/par: son los valores que van al cálculo y
  // los que se copian en la ronda al guardarla.
  function elegirTee(id: string) {
    setTeeId(id);
    const t = catalogo.find((x) => x.id === id);
    if (!t) return;
    setCampo(t.club);
    setRecorrido(t.recorrido);
    setTee(`${t.tee} (${t.genero === "H" ? "caballeros" : "damas"})`);
    setCr(String(t.cr));
    setSlope(String(t.slope));
    setPar(String(t.par));
  }
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
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-ajag-verde-900">
              El campo que juegas
            </h2>
            <button
              type="button"
              onClick={() => {
                setManual((v) => !v);
                setTeeId("");
                setRecorridoSel("");
                cambiarClub();
              }}
              className="text-sm font-medium text-ajag-verde-700 hover:underline"
            >
              {manual ? "Buscar en el catálogo" : "Mi campo no está en la lista"}
            </button>
          </div>

          {manual ? (
            <>
              <p className="mt-0.5 text-sm text-ajag-gris-500">
                El Course Rating, el Slope y el par vienen en la tarjeta del campo, junto al
                color de cada barra.
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
            </>
          ) : (
            <>
              <p className="mt-0.5 text-sm text-ajag-gris-500">
                Valoraciones oficiales de la RFEG: {catalogo.length} barras de {recorridos.length}{" "}
                recorridos en Madrid y Andalucía.
              </p>

              {/* Paso 1: buscador de campo. */}
              <div className="mt-3">
                <label htmlFor="buscar_club" className={claseEtiqueta}>
                  Campo de golf
                </label>
                {clubSel ? (
                  <div className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-ajag-gris-200 bg-ajag-verde-50/40 px-4 py-2.5">
                    <span className="text-sm font-medium text-ajag-verde-900">{clubSel}</span>
                    <button
                      type="button"
                      onClick={cambiarClub}
                      className="shrink-0 rounded-full border border-ajag-verde-700 px-3 py-1 text-xs font-medium text-ajag-verde-700 transition hover:bg-ajag-verde-50"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      id="buscar_club"
                      value={busquedaClub}
                      onChange={(e) => setBusquedaClub(e.target.value)}
                      placeholder="Buscar campo o ubicación..."
                      autoComplete="off"
                      className={claseCampo}
                    />
                    {clubesFiltrados.length > 0 ? (
                      <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-ajag-gris-200 bg-white py-1 shadow-lg">
                        {clubesFiltrados.map((c) => (
                          <li key={c}>
                            <button
                              type="button"
                              onClick={() => elegirClub(c)}
                              className="w-full px-4 py-2 text-left text-sm text-ajag-verde-900 hover:bg-ajag-verde-50"
                            >
                              {c}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Paso 2: recorrido del campo elegido. */}
              {clubSel ? (
                <div className="mt-4">
                  <label className={claseEtiqueta}>Recorrido</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {recorridosDelClub.map((r) => {
                      const clave = `${clubSel} · ${r}`;
                      const activo = recorridoSel === clave;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setRecorridoSel(clave);
                            setTeeId("");
                          }}
                          className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                            activo
                              ? "bg-ajag-verde-700 text-white"
                              : "border border-ajag-gris-200 text-ajag-verde-900 hover:bg-ajag-verde-50"
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Paso 3: barra de salida del recorrido elegido. */}
              {recorridoSel ? (
                <div className="mt-4">
                  <label className={claseEtiqueta}>Tee de salida</label>
                  <div className="mt-1 grid gap-2 sm:grid-cols-2">
                    {barrasDelRecorrido.map((t) => {
                      const activo = teeId === t.id;
                      const color = colorDeBarra(t.tee);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => elegirTee(t.id)}
                          className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm transition ${
                            activo
                              ? "bg-ajag-verde-700 text-white"
                              : "border border-ajag-gris-200 text-ajag-verde-900 hover:bg-ajag-verde-50"
                          }`}
                        >
                          <span
                            aria-hidden
                            className={`h-6 w-1.5 shrink-0 rounded-full ${color.bg} ${color.border ?? ""}`}
                          />
                          <span>
                            <span className="font-medium">
                              {t.tee} ({t.genero === "H" ? "caballeros" : "damas"})
                            </span>
                            <span className={`block text-xs ${activo ? "text-white/80" : "text-ajag-gris-500"}`}>
                              CR {t.cr} · Slope {t.slope} · Par {t.par}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Paso 4: ver la tarjeta del recorrido elegido. */}
              {teeId ? (
                <button
                  type="button"
                  onClick={() => setVerTarjeta(true)}
                  className="mt-4 rounded-xl border border-ajag-verde-700 px-4 py-2 text-sm font-medium text-ajag-verde-700 transition hover:bg-ajag-verde-50"
                >
                  Ver tarjeta
                </button>
              ) : null}

              {verTarjeta && teeId ? (
                <TarjetaModal
                  titulo={`${campo} — ${recorrido} — ${tee}`}
                  teeId={teeId}
                  onClose={() => setVerTarjeta(false)}
                />
              ) : null}

              {/* El cálculo usa el estado; al guardar la ronda se mandan los
                  valores ya resueltos del tee elegido. */}
              <input type="hidden" name="campo" value={campo} />
              <input type="hidden" name="recorrido" value={recorrido} />
              <input type="hidden" name="tee" value={tee} />
              <input type="hidden" name="course_rating" value={cr} />
              <input type="hidden" name="slope_rating" value={slope} />
              <input type="hidden" name="par" value={par} />
            </>
          )}
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
            <>
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

              {/* La tarjeta hoyo a hoyo solo existe para los campos del catálogo. */}
              {teeId && !manual ? (
                <div className="card-ajag p-5">
                  <button
                    type="button"
                    onClick={() => setVerHoyos((v) => !v)}
                    className="text-sm font-medium text-ajag-verde-700 hover:underline"
                  >
                    {verHoyos ? "Ocultar la tarjeta" : "Ver hoyos con golpe"}
                  </button>
                  {verHoyos ? (
                    <HoyosConGolpe teeId={teeId} handicapJuego={hcp.handicapJuego} />
                  ) : null}
                </div>
              ) : null}
            </>
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
