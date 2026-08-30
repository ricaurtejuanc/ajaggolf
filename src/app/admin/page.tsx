import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { obtenerOrganizadorIdActual } from "@/lib/data/organizador";

export const metadata: Metadata = { title: "Panel admin" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const organizadorIdActual = await obtenerOrganizadorIdActual();
  // Server Component: Date.now() se evalúa una vez por request, no en un
  // re-render de cliente, así que la regla de pureza no aplica aquí.
  // eslint-disable-next-line react-hooks/purity
  const hace7dias = new Date(Date.now() - 7 * 86400000).toISOString();

  let queryTorneos = supabase.from("torneos").select("id", { count: "exact", head: true });
  let queryPagos = supabase
    .from("pedidos_pago")
    .select("id", { count: "exact", head: true })
    .in("estado", ["pendiente_confirmacion", "marcado_pagado"]);

  if (organizadorIdActual) {
    queryTorneos = queryTorneos.eq("organizador_id", organizadorIdActual);
    queryPagos = queryPagos.eq("torneos.organizador_id", organizadorIdActual);
  }

  const [
    { count: torneosTotal },
    { count: pagosPendientes },
    { count: consultasSinLeer },
    { count: visitas7dias },
  ] = await Promise.all([
    queryTorneos,
    queryPagos,
    supabase
      .from("consultas_contacto")
      .select("id", { count: "exact", head: true })
      .eq("leido", false),
    supabase
      .from("visitas_web")
      .select("id", { count: "exact", head: true })
      .gte("created_at", hace7dias),
  ]);

  const stats = [
    { label: "Torneos", value: torneosTotal ?? 0, href: "/admin/torneos" },
    { label: "Pagos por confirmar", value: pagosPendientes ?? 0, href: "/admin/pedidos" },
    { label: "Consultas sin leer", value: consultasSinLeer ?? 0, href: "/admin/consultas" },
    { label: "Visitas (7 días)", value: visitas7dias ?? 0, href: null },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">Resumen</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => {
          const contenido = (
            <>
              <p className="font-display text-2xl font-semibold text-ajag-verde-900">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-ajag-gris-500">{stat.label}</p>
            </>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="card-ajag p-4 transition hover:shadow-sm">
              {contenido}
            </Link>
          ) : (
            <div key={stat.label} className="card-ajag p-4">
              {contenido}
            </div>
          );
        })}
      </div>
    </div>
  );
}
