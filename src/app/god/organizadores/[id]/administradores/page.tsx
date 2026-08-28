import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdministradoresGodForm } from "./administradores-form";

export const metadata: Metadata = { title: "Administradores · God Mode" };

export default async function AdministradoresGodPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: organizador }, { data: administradores }] = await Promise.all([
    supabase.from("organizadores").select("id, nombre").eq("id", id).maybeSingle(),
    supabase
      .from("usuarios_admin")
      .select("*")
      .eq("organizador_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!organizador) notFound();

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/god/organizadores" className="text-sm text-ajag-gris-500 hover:underline">
          ← Organizadores
        </Link>
      </div>
      <h1 className="mb-1 font-display text-2xl font-semibold text-aftergolf-verde-900">
        Administradores
      </h1>
      <p className="mb-6 text-sm text-ajag-gris-500">{organizador.nombre}</p>
      <AdministradoresGodForm organizadorId={id} administradores={administradores ?? []} />
    </div>
  );
}
