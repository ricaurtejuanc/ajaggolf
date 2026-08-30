"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerOrganizadorIdActual } from "@/lib/data/organizador";

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function marcarPedidoComoPagado(pedidoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesión no válida.");

  const { error } = await supabase
    .from("pedidos_pago")
    .update({ estado: "marcado_pagado", marcado_pagado_at: new Date().toISOString() })
    .eq("id", pedidoId)
    .eq("user_id", user.id)
    .eq("estado", "pendiente_confirmacion");

  if (error) throw error;
  revalidatePath("/cuenta");
}

export async function actualizarPerfil(
  _prevState: { ok: boolean; error: string | null },
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellidos = String(formData.get("apellidos") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const licencia_federativa = String(formData.get("licencia_federativa") ?? "").trim() || null;
  const telefono = String(formData.get("telefono") ?? "").trim() || null;
  const sexoRaw = String(formData.get("sexo") ?? "");
  const sexo = sexoRaw === "masculino" || sexoRaw === "femenino" ? sexoRaw : null;
  const handicapRaw = String(formData.get("handicap") ?? "").trim().replace(",", ".");
  const handicap = handicapRaw ? Number(handicapRaw) : null;

  if (!nombre) return { ok: false, error: "El nombre es obligatorio." };
  if (handicapRaw && Number.isNaN(handicap)) {
    return { ok: false, error: "El hándicap debe ser un número." };
  }

  const organizadorId = await obtenerOrganizadorIdActual();
  const { error } = await supabase
    .from("jugadores")
    .update({ nombre, apellidos, email, licencia_federativa, telefono, sexo, handicap })
    .eq("user_id", user.id)
    .eq("organizador_id", organizadorId as string);

  if (error) {
    if (error.code === "23505" && error.message.includes("licencia_federativa")) {
      return {
        ok: false,
        error: "Ya existe un jugador registrado con esa licencia federativa. Revisa el número e inténtalo de nuevo.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/cuenta");
  return { ok: true, error: null };
}
