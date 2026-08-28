import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "God Mode · AfterGolf" };

export default async function GodDashboardPage() {
  const supabase = await createClient();

  const [{ count: totalOrganizadores }, { count: organizadoresActivos }] = await Promise.all([
    supabase.from("organizadores").select("id", { count: "exact", head: true }),
    supabase
      .from("organizadores")
      .select("id", { count: "exact", head: true })
      .eq("activo", true),
  ]);

  const stats = [
    { label: "Organizadores totales", value: totalOrganizadores ?? 0 },
    { label: "Organizadores activos", value: organizadoresActivos ?? 0 },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-aftergolf-verde-900">Resumen</h1>
      <p className="mt-1 text-sm text-ajag-gris-500">
        Panel de administración de AfterGolf Torneos: alta y gestión de organizadores.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card-aftergolf p-4">
            <p className="font-display text-2xl font-semibold text-aftergolf-verde-900">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-ajag-gris-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <Link
        href="/god/organizadores/nuevo"
        className="mt-6 inline-block rounded-full bg-aftergolf-verde-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-aftergolf-verde-600"
      >
        + Nuevo organizador
      </Link>
    </div>
  );
}
