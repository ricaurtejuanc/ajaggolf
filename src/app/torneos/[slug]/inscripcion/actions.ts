"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { asegurarJugadorParaUsuario } from "@/lib/data/jugadores";
import { enviarEmailInscripcionRecibida, enviarEmailInscripcionConfirmada } from "@/lib/email";

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

  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellidos = String(formData.get("apellidos") ?? "").trim();
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

  if (!nombre || !apellidos || !email || !licencia_federativa || !sexo) {
    return { ok: false, error: "Rellena todos los campos obligatorios." };
  }
  if (handicapRaw && Number.isNaN(handicap)) {
    return { ok: false, error: "El hándicap debe ser un número." };
  }

  const { data: torneo } = await supabase
    .from("torneos")
    .select("id, nombre, fecha, precio_cents, precio_socio_cents, estado, cupo_maximo, modo_pago")
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
  const pagaEnClub = torneo.modo_pago === "club";

  if (user) {
    const jugador = await asegurarJugadorParaUsuario(supabase, user);

    if (torneo.cupo_maximo != null) {
      const [{ data: cupo }, { data: yaInscrito }] = await Promise.all([
        supabase.from("torneos_cupo").select("inscritos").eq("torneo_id", torneo.id).maybeSingle(),
        supabase
          .from("inscripciones")
          .select("id")
          .eq("torneo_id", torneo.id)
          .eq("jugador_id", jugador.id)
          .maybeSingle(),
      ]);
      if (!yaInscrito && (cupo?.inscritos ?? 0) >= torneo.cupo_maximo) {
        return { ok: false, error: "El cupo de este torneo ya está completo." };
      }
    }

    await supabase
      .from("jugadores")
      .update({ nombre, apellidos, email, licencia_federativa, sexo, handicap })
      .eq("id", jugador.id);

    // Pago en el club: no pasa por el carrito ni por Bizum, queda
    // confirmada directamente con su propio pedido ya cerrado.
    if (pagaEnClub) {
      const { data: pedido, error: errorPedido } = await supabase
        .from("pedidos_pago")
        .insert({
          user_id: user.id,
          metodo_pago: "club",
          estado: "confirmado",
          total_cents: precioAplicable,
          confirmado_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (errorPedido || !pedido) {
        return { ok: false, error: "No se ha podido guardar la inscripción. Inténtalo de nuevo." };
      }

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
          estado: "confirmada",
          pedido_pago_id: pedido.id,
        },
        { onConflict: "torneo_id,jugador_id" },
      );
      if (error) return { ok: false, error: error.message };

      if (email) {
        await enviarEmailInscripcionConfirmada({
          destinatario: email,
          nombre,
          items: [{ torneoNombre: torneo.nombre, torneoFecha: torneo.fecha, precioCents: precioAplicable }],
        });
      }

      redirect("/cuenta");
    }

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

  // Invitado: sin sesión (ni siquiera anónima). No hay auth.uid() que pase
  // las políticas RLS normales, así que se usa la service role key para
  // crear directamente el jugador (sin user_id), su inscripción y su
  // pedido de pago, y se le manda a una página de confirmación. Sin
  // cuenta no hay carrito multi-torneo: se paga (o se confirma, si es
  // pago en club) esta inscripción de una vez.
  let urlConfirmacion: string;
  try {
    const admin = createAdminClient();

    if (torneo.cupo_maximo != null) {
      const { data: cupo } = await admin
        .from("torneos_cupo")
        .select("inscritos")
        .eq("torneo_id", torneo.id)
        .maybeSingle();
      if ((cupo?.inscritos ?? 0) >= torneo.cupo_maximo) {
        return { ok: false, error: "El cupo de este torneo ya está completo." };
      }
    }

    // La licencia federativa es única en `jugadores`. Un invitado que ya
    // jugó antes (como invitado o con cuenta) reutiliza esa fila en vez de
    // chocar con la restricción; si es una cuenta real (user_id no nulo)
    // no se le pisan sus datos guardados con lo que ha escrito el invitado.
    const { data: jugadorExistente } = await admin
      .from("jugadores")
      .select("id, user_id")
      .eq("licencia_federativa", licencia_federativa)
      .maybeSingle();

    let jugadorId: string;
    if (jugadorExistente) {
      jugadorId = jugadorExistente.id;
      if (jugadorExistente.user_id == null) {
        await admin
          .from("jugadores")
          .update({ nombre, apellidos, email, sexo, handicap })
          .eq("id", jugadorId);
      }
    } else {
      const { data: jugadorInvitado, error: errorJugador } = await admin
        .from("jugadores")
        .insert({ nombre, apellidos, email, licencia_federativa, sexo, handicap, user_id: null })
        .select("id")
        .single();
      if (errorJugador || !jugadorInvitado) {
        console.error("Error creando jugador invitado:", errorJugador);
        return { ok: false, error: "No se ha podido guardar la inscripción. Inténtalo de nuevo." };
      }
      jugadorId = jugadorInvitado.id;
    }

    if (jugadorExistente) {
      const { data: yaInscrito } = await admin
        .from("inscripciones")
        .select("id")
        .eq("torneo_id", torneo.id)
        .eq("jugador_id", jugadorId)
        .maybeSingle();
      if (yaInscrito) {
        return { ok: false, error: "Esa licencia federativa ya está inscrita en este torneo." };
      }
    }

    const { data: pedido, error: errorPedido } = await admin
      .from("pedidos_pago")
      .insert(
        pagaEnClub
          ? {
              user_id: null,
              metodo_pago: "club",
              estado: "confirmado",
              total_cents: precioAplicable,
              confirmado_at: new Date().toISOString(),
            }
          : { user_id: null, metodo_pago: "bizum", total_cents: precioAplicable },
      )
      .select("id")
      .single();
    if (errorPedido || !pedido) {
      console.error("Error creando pedido de invitado:", errorPedido);
      return { ok: false, error: "No se ha podido guardar la inscripción. Inténtalo de nuevo." };
    }

    const { error: errorInscripcion } = await admin.from("inscripciones").insert({
      torneo_id: torneo.id,
      jugador_id: jugadorId,
      sexo,
      licencia_federativa,
      handicap_snapshot: handicap,
      juega_con_licencias: juegaConLicencias,
      es_socio: esSocio,
      precio_cents: precioAplicable,
      estado: pagaEnClub ? "confirmada" : "pendiente_pago",
      pedido_pago_id: pedido.id,
    });
    if (errorInscripcion) {
      console.error("Error creando inscripción de invitado:", errorInscripcion);
      return { ok: false, error: "No se ha podido guardar la inscripción. Inténtalo de nuevo." };
    }

    const item = { torneoNombre: torneo.nombre, torneoFecha: torneo.fecha, precioCents: precioAplicable };
    if (pagaEnClub) {
      await enviarEmailInscripcionConfirmada({ destinatario: email, nombre, items: [item] });
    } else {
      await enviarEmailInscripcionRecibida({ destinatario: email, nombre, items: [item] });
    }

    urlConfirmacion = `/torneos/${torneoSlug}/inscripcion/confirmacion?pedido=${pedido.id}`;
  } catch (err) {
    console.error("Error inesperado en inscripción de invitado:", err);
    return { ok: false, error: "No se ha podido guardar la inscripción. Inténtalo de nuevo." };
  }

  redirect(urlConfirmacion);
}
