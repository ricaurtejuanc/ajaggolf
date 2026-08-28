import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Organizadores · God Mode" };

export default async function GodOrganizadoresPage() {
  const supabase = await createClient();
  const { data: organizadores } = await supabase
    .from("organizadores")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-aftergolf-verde-900">
          Organizadores
        </h1>
        <Link
          href="/god/organizadores/nuevo"
          className="rounded-full bg-aftergolf-verde-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-aftergolf-verde-600"
        >
          + Nuevo organizador
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {(organizadores ?? []).length === 0 ? (
          <p className="text-sm text-ajag-gris-500">Todavía no hay organizadores dados de alta.</p>
        ) : (
          (organizadores ?? []).map((organizador) => (
            <div key={organizador.id} className="card-aftergolf flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-aftergolf-oro-200 bg-white">
                  {organizador.logo_url ? (
                    <Image
                      src={organizador.logo_url}
                      alt={organizador.nombre}
                      fill
                      unoptimized
                      className="object-contain p-1.5"
                      sizes="56px"
                    />
                  ) : null}
                </div>
                <div>
                  <p className="font-medium text-aftergolf-verde-900">
                    {organizador.nombre}
                    {!organizador.activo ? (
                      <span className="ml-2 rounded-full bg-ajag-gris-100 px-2 py-0.5 text-xs text-ajag-gris-500">
                        inactivo
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-ajag-gris-500">
                    /{organizador.slug} · {organizador.dominio || organizador.email_contacto || "sin dominio propio"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <Link
                  href={`/god/organizadores/${organizador.id}/administradores`}
                  className="text-sm font-medium text-aftergolf-verde-700 hover:underline"
                >
                  Administradores
                </Link>
                <Link
                  href={`/god/organizadores/${organizador.id}/editar`}
                  className="text-sm font-medium text-aftergolf-verde-700 hover:underline"
                >
                  Editar
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
