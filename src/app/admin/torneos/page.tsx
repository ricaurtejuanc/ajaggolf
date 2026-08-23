import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatearFechaCorta, formatearPrecio } from "@/lib/format";
import { EliminarTorneoButton } from "./eliminar-button";

export const metadata: Metadata = { title: "Torneos · Admin" };

const etiquetaEstado: Record<string, string> = {
  borrador: "Borrador",
  publicado: "Publicado",
  cerrado: "Cerrado",
  finalizado: "Finalizado",
};

export default async function AdminTorneosPage() {
  const supabase = await createClient();
  const { data: torneos } = await supabase
    .from("torneos")
    .select("*")
    .order("fecha", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">Torneos</h1>
        <Link
          href="/admin/torneos/nuevo"
          className="rounded-full bg-ajag-verde-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-ajag-verde-600"
        >
          + Nuevo torneo
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ajag-gris-100 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-ajag-gris-100 text-xs uppercase text-ajag-gris-500">
            <tr>
              <th className="px-4 py-3">Torneo</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(torneos ?? []).map((torneo) => (
              <tr key={torneo.id} className="border-b border-ajag-gris-100 last:border-0">
                <td className="px-4 py-3 font-medium text-ajag-verde-900">{torneo.nombre}</td>
                <td className="px-4 py-3 text-ajag-gris-500">
                  {formatearFechaCorta(torneo.fecha)}
                </td>
                <td className="px-4 py-3 text-ajag-gris-500">
                  {formatearPrecio(torneo.precio_cents)}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-ajag-verde-50 px-2.5 py-1 text-xs font-medium text-ajag-verde-700">
                    {etiquetaEstado[torneo.estado]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/torneos/${torneo.id}/salidas`}
                      className="text-sm font-medium text-ajag-verde-700 hover:underline"
                    >
                      Salidas
                    </Link>
                    <Link
                      href={`/admin/torneos/${torneo.id}/editar`}
                      className="text-sm font-medium text-ajag-verde-700 hover:underline"
                    >
                      Editar
                    </Link>
                    <EliminarTorneoButton torneoId={torneo.id} />
                  </div>
                </td>
              </tr>
            ))}
            {(torneos ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ajag-gris-500">
                  Todavía no hay torneos creados.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
