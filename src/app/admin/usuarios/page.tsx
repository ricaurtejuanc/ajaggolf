import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { UsuariosList } from "./usuarios-list";

export const metadata: Metadata = { title: "Usuarios · Admin" };

export default async function UsuariosPage() {
  const admin = await getUsuarioAdmin();
  if (!admin || !admin.organizador_id) return null;

  const supabase = await createClient();
  const { data: usuarios } = await supabase
    .from("jugadores")
    .select("id, nombre, apellidos, email, telefono, handicap, created_at")
    .eq("organizador_id", admin.organizador_id)
    .not("user_id", "is", null)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-semibold text-ajag-verde-900">
        Usuarios
      </h1>
      <p className="mb-6 text-sm text-ajag-gris-500">
        Personas que se han registrado con cuenta (Google o email). No incluye a quienes se
        inscriben como invitados sin crear cuenta.
      </p>
      <UsuariosList usuarios={usuarios ?? []} />
    </div>
  );
}
