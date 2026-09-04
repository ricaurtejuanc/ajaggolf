import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { economiaActiva } from "@/lib/data/configuracion";
import { formatearFechaCorta, formatearPrecio } from "@/lib/format";
import { construirMensajeWhatsapp, urlCompartirWhatsapp } from "@/lib/whatsapp";
import { EliminarTorneoButton } from "./eliminar-button";

export const metadata: Metadata = { title: "Torneos · Admin" };

const etiquetaEstado: Record<string, string> = {
  borrador: "Borrador",
  publicado: "Publicado",
  cerrado: "Completo",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

const claseBoton =
  "rounded-full border border-ajag-verde-700 px-4 py-2 text-sm font-medium text-ajag-verde-700 transition hover:bg-ajag-verde-50";

export default async function AdminTorneosPage() {
  const admin = await getUsuarioAdmin();
  const conEconomia = admin?.organizador_id ? await economiaActiva(admin.organizador_id) : false;

  // El dominio actual es el propio del organizador (proxy.ts ya lo resolvió
  // para servir esta página): sirve tal cual para armar el link de la
  // ficha pública que se comparte por WhatsApp, sin otra consulta.
  const host = (await headers()).get("host");

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

      <div className="mt-6 flex flex-col gap-4">
        {(torneos ?? []).map((torneo) => (
          <div key={torneo.id} className="card-ajag p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ajag-oro-600">
                  {formatearFechaCorta(torneo.fecha)}
                </p>
                <h2 className="font-display text-lg font-semibold text-ajag-verde-900">
                  {torneo.nombre}
                </h2>
                <p className="mt-0.5 text-sm text-ajag-gris-500">
                  {formatearPrecio(torneo.precio_cents)}
                </p>
              </div>
              <span className="rounded-full bg-ajag-verde-50 px-2.5 py-1 text-xs font-medium text-ajag-verde-700">
                {etiquetaEstado[torneo.estado]}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ajag-gris-100 pt-4">
              <Link href={`/admin/torneos/${torneo.id}/editar`} className={claseBoton}>
                Editar
              </Link>
              <Link href={`/admin/torneos/${torneo.id}/inscritos`} className={claseBoton}>
                Inscritos
              </Link>
              <Link href={`/admin/torneos/${torneo.id}/pagos`} className={claseBoton}>
                Pagos
              </Link>
              <Link href={`/admin/torneos/${torneo.id}/salidas`} className={claseBoton}>
                Horarios
              </Link>
              <Link href={`/admin/torneos/${torneo.id}/resultados`} className={claseBoton}>
                Calificaciones
              </Link>
              {torneo.estado === "publicado" && host ? (
                <a
                  href={urlCompartirWhatsapp(
                    construirMensajeWhatsapp(torneo, `https://${host}/torneos/${torneo.slug}`),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${claseBoton} flex items-center gap-1.5`}
                >
                  <MessageCircle size={15} />
                  Compartir
                </a>
              ) : null}
              {conEconomia ? (
                <Link href={`/admin/economia/${torneo.id}`} className={claseBoton}>
                  Economía
                </Link>
              ) : null}
              <div className="ml-auto">
                <EliminarTorneoButton torneoId={torneo.id} />
              </div>
            </div>
          </div>
        ))}

        {(torneos ?? []).length === 0 ? (
          <div className="card-ajag p-8 text-center text-ajag-gris-500">
            Todavía no hay torneos creados.
          </div>
        ) : null}
      </div>
    </div>
  );
}
