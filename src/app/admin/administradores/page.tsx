import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { AdministradoresForm } from "./administradores-form";

export const metadata: Metadata = { title: "Administradores · Admin" };

export default async function AdministradoresPage() {
  const admin = await getUsuarioAdmin();
  if (!admin || !admin.organizador_id) return null;

  const supabase = await createClient();
  const { data: administradores } = await supabase
    .from("usuarios_admin")
    .select("*")
    .eq("organizador_id", admin.organizador_id)
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-ajag-verde-900">
        Administradores
      </h1>
      <AdministradoresForm administradores={administradores ?? []} miId={admin.id} />
    </div>
  );
}
