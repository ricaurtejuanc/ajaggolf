"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { extraerFilasPdf } from "@/lib/resultados/extraer-pdf";
import { recalcularClasificacionGlobal } from "@/lib/clasificacion/recalcular";

export type EstadoDocumento = { ok: boolean; error: string | null };

export async function subirDocumento(
  torneoId: string,
  storagePath: string,
  nombreArchivo: string,
  esPdf: boolean,
): Promise<EstadoDocumento> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const supabase = await createClient();

  let filasExtraidas: unknown = { filas: [], texto: "" };
  if (esPdf) {
    try {
      const { data: blob, error: errorDescarga } = await supabase.storage
        .from("resultados-pdf")
        .download(storagePath);
      if (errorDescarga || !blob) throw errorDescarga ?? new Error("Descarga vacía");
      const buffer = Buffer.from(await blob.arrayBuffer());
      const { textoCompleto, filas } = await extraerFilasPdf(buffer);
      filasExtraidas = { filas, texto: textoCompleto };
    } catch {
      // Si el PDF no se puede leer (escaneado como imagen, formato raro...)
      // seguimos adelante: el admin siempre puede rellenar a mano.
      filasExtraidas = { filas: [], texto: "" };
    }
  }

  const { error } = await supabase.from("resultados_pdf_uploads").insert({
    torneo_id: torneoId,
    storage_path: storagePath,
    nombre_archivo: nombreArchivo,
    mapeo_columnas: {},
    filas_extraidas: filasExtraidas,
    estado: "preview",
    subido_por: admin.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/torneos/${torneoId}/resultados`);
  return { ok: true, error: null };
}

export type EstadoResultados = { ok: boolean; error: string | null };

export async function guardarResultados(
  torneoId: string,
  publicar: boolean,
  _prevState: EstadoResultados,
  formData: FormData,
): Promise<EstadoResultados> {
  const admin = await getUsuarioAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const inscripcionIds = formData.getAll("inscripcion_id").map((v) => String(v));
  const nombres = formData.getAll("nombre_mostrado").map((v) => String(v).trim());
  const licencias = formData.getAll("licencia_federativa").map((v) => String(v).trim());
  const handicaps = formData.getAll("handicap").map((v) => String(v).trim());
  const posiciones = formData.getAll("posicion").map((v) => String(v).trim());
  const puntos = formData.getAll("puntos").map((v) => String(v).trim());
  const golpes = formData.getAll("golpes").map((v) => String(v).trim());

  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("torneos")
    .select("id, liga_pool_id")
    .eq("id", torneoId)
    .maybeSingle();
  if (!torneo) return { ok: false, error: "Torneo no encontrado." };

  const filas = nombres
    .map((nombre, i) => ({
      torneo_id: torneoId,
      jugador_id: null as string | null,
      inscripcion_id: inscripcionIds[i] || null,
      nombre_mostrado: nombre,
      licencia_federativa: licencias[i] || null,
      handicap: handicaps[i] ? Number(handicaps[i].replace(",", ".")) : null,
      posicion: posiciones[i] ? parseInt(posiciones[i], 10) : null,
      puntos: puntos[i] ? Number(puntos[i].replace(",", ".")) : null,
      golpes: golpes[i] ? Number(golpes[i].replace(",", ".")) : null,
      estado: publicar ? "publicado" : "preview",
    }))
    .filter((f) => f.nombre_mostrado);

  if (inscripcionIds.length > 0) {
    const { data: inscritos } = await supabase
      .from("inscripciones")
      .select("id, jugador_id")
      .in("id", inscripcionIds.filter(Boolean));
    const jugadorPorInscripcion = new Map((inscritos ?? []).map((i) => [i.id, i.jugador_id]));
    for (const fila of filas) {
      if (fila.inscripcion_id) {
        fila.jugador_id = jugadorPorInscripcion.get(fila.inscripcion_id) ?? null;
      }
    }
  }

  await supabase.from("resultados").delete().eq("torneo_id", torneoId);

  if (filas.length > 0) {
    const { error } = await supabase.from("resultados").insert(filas);
    if (error) return { ok: false, error: error.message };
  }

  if (publicar) {
    await supabase
      .from("resultados_pdf_uploads")
      .update({ estado: "publicado", publicado_at: new Date().toISOString() })
      .eq("torneo_id", torneoId)
      .eq("estado", "preview");
  }

  if (torneo.liga_pool_id) {
    await recalcularClasificacionGlobal(torneo.liga_pool_id);
  }

  revalidatePath(`/admin/torneos/${torneoId}/resultados`);
  revalidatePath(`/torneos`);
  return { ok: true, error: null };
}

export async function publicarDocumento(torneoId: string, documentoId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  await supabase
    .from("resultados_pdf_uploads")
    .update({ estado: "publicado", publicado_at: new Date().toISOString() })
    .eq("id", documentoId);

  revalidatePath(`/admin/torneos/${torneoId}/resultados`);
  revalidatePath("/torneos");
}

export async function despublicarDocumento(torneoId: string, documentoId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  await supabase.from("resultados_pdf_uploads").update({ estado: "preview" }).eq("id", documentoId);

  revalidatePath(`/admin/torneos/${torneoId}/resultados`);
}
