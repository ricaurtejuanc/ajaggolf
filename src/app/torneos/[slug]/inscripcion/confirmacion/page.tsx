import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerBizumNumero } from "@/lib/data/configuracion";
import { obtenerTorneoPorSlug } from "@/lib/data/torneos";
import { ConfirmacionPago } from "./confirmacion-pago";
import type { EstadoPedidoPago } from "@/types/database";

export const metadata: Metadata = { title: "Inscripción confirmada" };

type PedidoInvitado = {
  id: string;
  estado: EstadoPedidoPago;
  total_cents: number;
  inscripciones: { torneo_id: string }[];
};

export default async function ConfirmacionInscripcionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pedido?: string }>;
}) {
  const { slug } = await params;
  const { pedido: pedidoId } = await searchParams;
  if (!pedidoId) notFound();

  const torneo = await obtenerTorneoPorSlug(slug);
  if (!torneo) notFound();

  const admin = createAdminClient();
  const [{ data: pedidoData }, bizumNumero] = await Promise.all([
    admin
      .from("pedidos_pago")
      .select("id, estado, total_cents, inscripciones(torneo_id)")
      .eq("id", pedidoId)
      .is("user_id", null)
      .maybeSingle(),
    obtenerBizumNumero(),
  ]);

  const pedido = pedidoData as unknown as PedidoInvitado | null;
  if (!pedido || !pedido.inscripciones.some((i) => i.torneo_id === torneo.id)) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="card-ajag p-8 text-center">
        <Trophy size={32} className="mx-auto text-ajag-oro-600" />
        <h1 className="mt-3 font-display text-xl font-semibold text-ajag-verde-900">
          ¡Ya casi está!
        </h1>
        <p className="mt-2 text-sm text-ajag-gris-500">
          Tu inscripción a {torneo.nombre} está guardada. Solo falta el pago.
          Te hemos enviado un email: no será válida hasta que recibas el
          email de confirmación.
        </p>
      </div>

      <ConfirmacionPago
        pedidoId={pedido.id}
        totalCents={pedido.total_cents}
        estadoInicial={pedido.estado}
        bizumNumero={bizumNumero}
      />

      <p className="mt-6 rounded-xl bg-ajag-verde-50 px-4 py-3 text-center text-sm text-ajag-verde-900">
        ¿Quieres que tus datos se rellenen solos la próxima vez y ver tu
        historial de torneos?{" "}
        <Link href="/login" className="font-medium underline">
          Crea tu cuenta
        </Link>
        .
      </p>
    </div>
  );
}
