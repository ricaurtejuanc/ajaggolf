"use server";

import { createClient } from "@/lib/supabase/server";

export type EstadoContacto = { ok: boolean; error: string | null };

export async function enviarConsulta(
  _prevState: EstadoContacto,
  formData: FormData,
): Promise<EstadoContacto> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim() || null;
  const mensaje = String(formData.get("mensaje") ?? "").trim();

  if (!nombre || !email || !mensaje) {
    return { ok: false, error: "Rellena nombre, email y mensaje." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("consultas_contacto")
    .insert({ nombre, email, telefono, mensaje });

  if (error) return { ok: false, error: "No se pudo enviar. Inténtalo de nuevo." };
  return { ok: true, error: null };
}
