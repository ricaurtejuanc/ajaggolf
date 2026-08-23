"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asegurarJugadorParaUsuario } from "@/lib/data/jugadores";

export type EstadoInscripcionForm = { ok: boolean; error: string | null };

export async function inscribirse(
  torneoSlug: string,
  _prevState: EstadoInscripcionForm,
  formData: FormData,
): Promise<EstadoInscripcionForm> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/torneos/${torneoSlug}/inscripcion`);

  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const licencia_federativa = String(formData.get("licencia_federativa") ?? "").trim();
  const sexoRaw = String(formData.get("sexo") ?? "");
  const sexo = sexoRaw === "masculino" || sexoRaw === "femenino" ? sexoRaw : null;
  const juegaConLicencias = formData
    .getAll("juega_con_licencia")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const esSocioRaw = String(formData.get("es_socio") ?? "");
  const handicapRaw = String(formData.get("handicap") ?? "").trim().replace(",", ".");
  const handicap = handicapRaw ? Number(handicapRaw) : null;

  if (!nombre || !email || !licencia_federativa || !sexo) {
    return { ok: false, error: "Rellena todos los campos obligatorios." };
  }
  if (handicapRaw && Number.isNaN(handicap)) {
    return { ok: false, error: "El hándicap debe ser un número." };
  }

  const { data: torneo } = await supabase
    .from("torneos")
    .select("id, precio_cents, precio_socio_cents, estado, cupo_maximo")
    .eq("slug", torneoSlug)
    .maybeSingle();

  if (!torneo || torneo.estado !== "publicado") {
    return { ok: false, error: "Este torneo no admite inscripciones en este momento." };
  }

  const tieneDistincionSocio = torneo.precio_socio_cents != null;
  if (tieneDistincionSocio && esSocioRaw !== "si" && esSocioRaw !== "no") {
    return { ok: false, error: "Indica si eres socio del club o no." };
  }
  const esSocio = tieneDistincionSocio && esSocioRaw === "si";
  const precioAplicable =
    esSocio && torneo.precio_socio_cents != null ? torneo.precio_socio_cents : torneo.precio_cents;

  if (torneo.cupo_maximo != null) {
    const { count } = await supabase
      .from("inscripciones")
      .select("id", { count: "exact", head: true })
      .eq("torneo_id", torneo.id)
      .in("estado", ["pendiente_pago", "confirmada"]);
    if ((count ?? 0) >= torneo.cupo_maximo) {
      return { ok: false, error: "El cupo de este torneo ya está completo." };
    }
  }

  const jugador = await asegurarJugadorParaUsuario(supabase, user);

  await supabase
    .from("jugadores")
    .update({ nombre, email, licencia_federativa, sexo, handicap })
    .eq("id", jugador.id);

  const { error } = await supabase.from("inscripciones").upsert(
    {
      torneo_id: torneo.id,
      jugador_id: jugador.id,
      sexo,
      licencia_federativa,
      handicap_snapshot: handicap,
      juega_con_licencias: juegaConLicencias,
      es_socio: esSocio,
      precio_cents: precioAplicable,
      estado: "carrito",
    },
    { onConflict: "torneo_id,jugador_id" },
  );

  if (error) return { ok: false, error: error.message };

  redirect("/carrito");
}
