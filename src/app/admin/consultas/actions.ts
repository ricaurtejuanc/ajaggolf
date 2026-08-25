"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { enviarEmailRespuestaConsulta } from "@/lib/email";
import { obtenerOrganizadorPorId } from "@/lib/data/organizador";

export async function marcarConsultaLeida(consultaId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  await supabase.from("consultas_contacto").update({ leido: true }).eq("id", consultaId);

  revalidatePath("/admin/consultas");
}

export type EstadoRespuestaConsulta = { ok: boolean; error: string | null; aviso: string | null };

export async function responderConsulta(
  consultaId: string,
  _prevState: EstadoRespuestaConsulta,
  formData: FormData,
): Promise<EstadoRespuestaConsulta> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado.", aviso: null };

  const respuesta = String(formData.get("respuesta") ?? "").trim();
  if (!respuesta) return { ok: false, error: "Escribe una respuesta.", aviso: null };

  const supabase = await createClient();
  const { data: consulta } = await supabase
    .from("consultas_contacto")
    .select("nombre, email, mensaje, organizador_id")
    .eq("id", consultaId)
    .maybeSingle();
  if (!consulta) return { ok: false, error: "Consulta no encontrada.", aviso: null };

  const { error } = await supabase
    .from("consultas_contacto")
    .update({ respuesta, respondido_at: new Date().toISOString(), leido: true })
    .eq("id", consultaId);
  if (error) return { ok: false, error: error.message, aviso: null };

  const organizador = await obtenerOrganizadorPorId(supabase, consulta.organizador_id);
  const enviado = await enviarEmailRespuestaConsulta({
    destinatario: consulta.email,
    nombre: consulta.nombre,
    mensajeOriginal: consulta.mensaje,
    respuesta,
    organizador,
  });

  revalidatePath("/admin/consultas");
  return {
    ok: true,
    error: null,
    // La respuesta ya está guardada aunque el email falle: se avisa para
    // que el admin sepa que tiene que contactar por otra vía, en vez de
    // pensar que ya se ha enviado.
    aviso: enviado
      ? null
      : "Guardada, pero no se pudo enviar el email (revisa la configuración SMTP). Contacta con la persona por otra vía.",
  };
}
