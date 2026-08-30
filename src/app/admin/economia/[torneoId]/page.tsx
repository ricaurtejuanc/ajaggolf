import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { obtenerEconomiaTorneo } from "@/lib/data/economia";
import { economiaActiva } from "@/lib/data/configuracion";
import { getUsuarioAdmin } from "@/lib/auth";
import { formatearPrecio, formatearFechaCorta } from "@/lib/format";
import { KpisEconomia, Dato, DesgloseCategorias } from "../componentes";
import { TablaMovimientos } from "../tabla-movimientos";
import { MovimientoForm } from "../movimiento-form";

export const metadata: Metadata = { title: "Economía del torneo · Admin" };

const claseEnlace =
  "rounded-full border border-ajag-verde-700 px-4 py-2 text-sm font-medium text-ajag-verde-700 transition hover:bg-ajag-verde-50";

export default async function AdminEconomiaTorneoPage({
  params,
}: {
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;

  // Con la economía apagada esta ficha no existe para el club: se manda al
  // resumen, que es donde está el interruptor para volver a encenderla.
  const admin = await getUsuarioAdmin();
  if (admin?.organizador_id && !(await economiaActiva(admin.organizador_id))) {
    redirect("/admin/economia");
  }

  const datos = await obtenerEconomiaTorneo(torneoId);
  if (!datos) notFound();

  const { torneo, resumen, estadisticas: est, movimientos } = datos;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/economia" className="text-sm text-ajag-gris-500 hover:underline">
          ← Economía
        </Link>
        <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">
          {torneo.nombre}
        </h1>
        <p className="mt-0.5 text-sm text-ajag-gris-500">{formatearFechaCorta(torneo.fecha)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/admin/torneos/${torneo.id}/editar`} className={claseEnlace}>
            Editar torneo
          </Link>
          <Link href={`/admin/torneos/${torneo.id}/inscritos`} className={claseEnlace}>
            Inscritos
          </Link>
        </div>
      </div>

      <KpisEconomia
        ingresos={resumen.ingresosTotales}
        gastos={resumen.gastos}
        pie={
          resumen.pendienteCobro > 0
            ? `${formatearPrecio(resumen.pendienteCobro)} pendientes de cobro (${resumen.inscritosPendientes} inscripciones sin confirmar el pago).`
            : undefined
        }
      />

      <h2 className="mt-8 font-display text-lg font-semibold text-ajag-verde-900">
        Estadísticas del torneo
      </h2>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div className="card-ajag p-5">
          <h3 className="font-display text-base font-semibold text-ajag-verde-900">
            Participación
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <Dato
              label="Inscritos confirmados"
              valor={String(est.confirmados)}
              nota={
                est.cupoMaximo
                  ? `${est.ocupacionPct} % del cupo (${est.cupoMaximo} plazas)`
                  : "Sin cupo máximo definido"
              }
            />
            <Dato label="Pendientes de pago" valor={String(est.pendientes)} />
            <Dato
              label="Socios"
              valor={String(est.socios)}
              nota={`${est.noSocios} no socios`}
            />
            <Dato label="Canceladas" valor={String(est.canceladas)} />
          </div>
        </div>

        <div className="card-ajag p-5">
          <h3 className="font-display text-base font-semibold text-ajag-verde-900">
            Por jugador
          </h3>
          <p className="mt-0.5 text-xs text-ajag-gris-500">
            Medias sobre los {est.confirmados} inscritos confirmados.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-4">
            <Dato label="Ingreso" valor={formatearPrecio(est.ingresoPorJugador)} />
            <Dato label="Gasto" valor={formatearPrecio(est.gastoPorJugador)} />
            <Dato label="Beneficio" valor={formatearPrecio(est.beneficioPorJugador)} />
          </div>
        </div>

        <DesgloseCategorias
          titulo="De dónde vienen los ingresos"
          filas={est.ingresosPorCategoria}
          variante="ingreso"
        />
        <DesgloseCategorias
          titulo="En qué se van los gastos"
          filas={est.gastosPorCategoria}
          variante="gasto"
        />
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold text-ajag-verde-900">
        Movimientos del torneo
      </h2>
      <p className="mt-0.5 text-sm text-ajag-gris-500">
        Los {formatearPrecio(resumen.ingresosInscripciones)} de las {est.confirmados}{" "}
        inscripciones confirmadas se calculan solos y no se editan aquí. Añade en esta tabla lo
        demás: pago al club, regalos, catering, patrocinios…
      </p>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <TablaMovimientos
          movimientos={movimientos}
          vacio="Todavía no hay gastos ni ingresos extra en este torneo."
        />
        <MovimientoForm torneoId={torneo.id} fechaSugerida={torneo.fecha} />
      </div>
    </div>
  );
}
