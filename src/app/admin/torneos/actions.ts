"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { leerPremiosDesdeFormData, leerPremiosHoyoDesdeFormData } from "@/lib/premios";
import type {
  EstadoTorneo,
  FormatoPuntuacion,
  ModoAsignacionSalida,
  ModoJuego,
  ModoPagoTorneo,
  ModoSalida,
} from "@/types/database";

export type EstadoTorneoForm = { ok: boolean; error: string | null };

function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos (á -> a + combining mark)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function leerCamposTorneo(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const precioEuros = String(formData.get("precio_euros") ?? "0").replace(",", ".");
  const precioSocioEuros = String(formData.get("precio_socio_euros") ?? "").trim().replace(",", ".");
  const cupoRaw = String(formData.get("cupo_maximo") ?? "").trim();
  const leerTees = (campo: string) =>
    formData
      .getAll(campo)
      .map((v) => String(v).trim())
      .filter(Boolean);
  const extras = formData.getAll("extras").map((v) => String(v));
  const teesConsecutivo = formData
    .getAll("tees_consecutivo")
    .map((v) => parseInt(String(v), 10))
    .filter((n) => !Number.isNaN(n));
  const clamp = (n: number) => Math.min(100, Math.max(0, n));
  const focalX = parseInt(String(formData.get("poster_focal_x") ?? "50"), 10);
  const focalY = parseInt(String(formData.get("poster_focal_y") ?? "50"), 10);

  return {
    nombre,
    descripcion: String(formData.get("descripcion") ?? "").trim() || null,
    info_adicional: String(formData.get("info_adicional") ?? "").trim() || null,
    normas: String(formData.get("normas") ?? "").trim() || null,
    campo_golf: String(formData.get("campo_golf") ?? "").trim(),
    recorrido: String(formData.get("recorrido") ?? "").trim() || null,
    tees_masculino: leerTees("tees_masculino"),
    tees_femenino: leerTees("tees_femenino"),
    fecha: String(formData.get("fecha") ?? ""),
    hora_inicio: String(formData.get("hora_inicio") ?? "").trim() || null,
    poster_url: String(formData.get("poster_url") ?? "").trim() || null,
    poster_focal_x: Number.isNaN(focalX) ? 50 : clamp(focalX),
    poster_focal_y: Number.isNaN(focalY) ? 50 : clamp(focalY),
    premios: leerPremiosDesdeFormData(formData),
    premios_hoyo: leerPremiosHoyoDesdeFormData(formData),
    precio_cents: Math.round(parseFloat(precioEuros || "0") * 100),
    precio_socio_cents: precioSocioEuros ? Math.round(parseFloat(precioSocioEuros) * 100) : null,
    cupo_maximo: cupoRaw ? parseInt(cupoRaw, 10) : null,
    formato_puntuacion: String(formData.get("formato_puntuacion") ?? "stableford") as FormatoPuntuacion,
    modo_juego: String(formData.get("modo_juego") ?? "individual") as ModoJuego,
    modo_salida: String(formData.get("modo_salida") ?? "consecutivo") as ModoSalida,
    tees_consecutivo: teesConsecutivo.length > 0 ? teesConsecutivo : [1],
    modo_asignacion_salida: String(
      formData.get("modo_asignacion_salida") ?? "handicap",
    ) as ModoAsignacionSalida,
    liga_pool_id: String(formData.get("liga_pool_id") ?? "").trim() || null,
    estado: String(formData.get("estado") ?? "borrador") as EstadoTorneo,
    modo_pago: String(formData.get("modo_pago") ?? "organizador") as ModoPagoTorneo,
    extras,
    inscripcion_url_externa: String(formData.get("inscripcion_url_externa") ?? "").trim() || null,
    gestion_whatsapp: formData.get("gestion_whatsapp") === "on",
  };
}

async function guardarCampoGolfSiNuevo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nombre: string,
  recorrido: string | null,
) {
  if (!nombre || !recorrido) return;
  await supabase
    .from("campos_golf")
    .upsert({ nombre, recorrido }, { onConflict: "nombre,recorrido", ignoreDuplicates: true });
}

export async function crearTorneo(
  _prevState: EstadoTorneoForm,
  formData: FormData,
): Promise<EstadoTorneoForm> {
  const admin = await getUsuarioAdmin();
  if (!admin?.organizador_id) return { ok: false, error: "No autorizado." };

  const campos = leerCamposTorneo(formData);
  if (!campos.nombre || !campos.campo_golf || !campos.fecha) {
    return { ok: false, error: "Nombre, campo y fecha son obligatorios." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("torneos")
    .insert({
      ...campos,
      slug: slugify(campos.nombre),
      created_by: admin.id,
      organizador_id: admin.organizador_id,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Error al crear el torneo." };

  await guardarCampoGolfSiNuevo(supabase, campos.campo_golf, campos.recorrido);

  revalidatePath("/admin/torneos");
  revalidatePath("/torneos");
  redirect(`/admin/torneos/${data.id}/editar`);
}

export async function actualizarTorneo(
  torneoId: string,
  _prevState: EstadoTorneoForm,
  formData: FormData,
): Promise<EstadoTorneoForm> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const campos = leerCamposTorneo(formData);
  if (!campos.nombre || !campos.campo_golf || !campos.fecha) {
    return { ok: false, error: "Nombre, campo y fecha son obligatorios." };
  }

  // El slug no se toca en la edición (no hay campo para ello): cambiar el
  // nombre no debe romper enlaces ya compartidos al torneo.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("torneos")
    .update(campos)
    .eq("id", torneoId)
    .select("slug")
    .single();

  if (error) return { ok: false, error: error.message };

  await guardarCampoGolfSiNuevo(supabase, campos.campo_golf, campos.recorrido);

  revalidatePath("/admin/torneos");
  revalidatePath(`/admin/torneos/${torneoId}/editar`);
  revalidatePath("/torneos");
  if (data) {
    revalidatePath(`/torneos/${data.slug}`);
    revalidatePath(`/torneos/${data.slug}/clasificacion`);
  }
  redirect("/admin/torneos");
}

export async function eliminarTorneo(torneoId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  await supabase.from("torneos").delete().eq("id", torneoId);

  revalidatePath("/admin/torneos");
  revalidatePath("/torneos");
}
