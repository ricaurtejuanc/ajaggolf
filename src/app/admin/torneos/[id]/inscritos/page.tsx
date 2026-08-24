import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listarInscritosDetallados } from "@/lib/data/inscripciones";
import { formatearPrecio } from "@/lib/format";
import { ExportarXlsButton } from "./exportar-xls-button";

export const metadata: Metadata = { title: "Inscritos · Admin" };

const etiquetaEstado: Record<string, string> = {
  pendiente_pago: "Pendiente de pago",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

const claseEstado: Record<string, string> = {
  pendiente_pago: "bg-ajag-oro-500/20 text-ajag-oro-600",
  confirmada: "bg-ajag-verde-50 text-ajag-verde-700",
  cancelada: "bg-ajag-gris-100 text-ajag-gris-500",
};

export default async function AdminInscritosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: torneo }, inscritos] = await Promise.all([
    supabase.from("torneos").select("id, nombre, slug").eq("id", id).maybeSingle(),
    listarInscritosDetallados(id),
  ]);
  if (!torneo) notFound();

  const confirmados = inscritos.filter((i) => i.estado === "confirmada").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/admin/torneos/${id}/editar`}
            className="text-sm text-ajag-gris-500 hover:underline"
          >
            ← {torneo.nombre}
          </Link>
          <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">Inscritos</h1>
          <p className="mt-0.5 text-sm text-ajag-gris-500">
            {confirmados} confirmados · {inscritos.length} en total
          </p>
        </div>
        <ExportarXlsButton torneoSlug={torneo.slug} inscritos={inscritos} />
      </div>

      {inscritos.length === 0 ? (
        <div className="card-ajag p-8 text-center text-ajag-gris-500">
          Todavía no hay ningún jugador inscrito en este torneo.
        </div>
      ) : (
        <div className="card-ajag overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-ajag-gris-100 text-xs uppercase tracking-wide text-ajag-gris-500">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Licencia</th>
                <th className="px-4 py-3 font-medium">Hándicap</th>
                <th className="px-4 py-3 font-medium">Socio</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Email</th>
              </tr>
            </thead>
            <tbody>
              {inscritos.map((i) => (
                <tr key={i.inscripcionId} className="border-b border-ajag-gris-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-ajag-verde-900">{i.nombreCompleto}</td>
                  <td className="px-4 py-3 text-ajag-gris-500">{i.licenciaFederativa ?? "—"}</td>
                  <td className="px-4 py-3 text-ajag-gris-500">{i.handicap ?? "—"}</td>
                  <td className="px-4 py-3 text-ajag-gris-500">{i.esSocio ? "Sí" : "No"}</td>
                  <td className="px-4 py-3 text-ajag-gris-500">{formatearPrecio(i.precioCents)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${claseEstado[i.estado] ?? "bg-ajag-gris-100 text-ajag-gris-500"}`}
                    >
                      {etiquetaEstado[i.estado] ?? i.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ajag-gris-500">{i.email ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
