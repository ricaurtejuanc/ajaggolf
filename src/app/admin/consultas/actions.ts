"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { enviarEmailRespuestaConsulta } from "@/lib/email";

export async function marcarConsultaLeida(consultaId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  await supabase.from("consultas_contacto").update({ leido: true }).eq("id", consultaId);

  revalidatePath("/admin/consultas");
}

export type EstadoRespuestaConsulta = { ok: boolean; error: string | null };

export async function responderConsulta(
  consultaId: string,
  _prevState: EstadoRespuestaConsulta,
  formData: FormData,
): Promise<EstadoRespuestaConsulta> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const respuesta = String(formData.get("respuesta") ?? "").trim();
  if (!respuesta) return { ok: false, error: "Escribe una respuesta." };

  const supabase = await createClient();
  const { data: consulta } = await supabase
    .from("consultas_contacto")
    .select("nombre, email, mensaje")
    .eq("id", consultaId)
    .maybeSingle();
  if (!consulta) return { ok: false, error: "Consulta no encontrada." };

  const { error } = await supabase
    .from("consultas_contacto")
    .update({ respuesta, respondido_at: new Date().toISOString(), leido: true })
    .eq("id", consultaId);
  if (error) return { ok: false, error: error.message };

  await enviarEmailRespuestaConsulta({
    destinatario: consulta.email,
    nombre: consulta.nombre,
    mensajeOriginal: consulta.mensaje,
    respuesta,
  });

  revalidatePath("/admin/consultas");
  return { ok: true, error: null };
}
