import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { obtenerTorneoPorSlug } from "@/lib/data/torneos";
import { asegurarJugadorParaUsuario } from "@/lib/data/jugadores";
import { obtenerWhatsappTelefono } from "@/lib/data/configuracion";
import { formatearFecha } from "@/lib/format";
import { InscripcionForm } from "./inscripcion-form";

export const metadata: Metadata = { title: "Inscripción" };

export default async function InscripcionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const torneo = await obtenerTorneoPorSlug(slug);
  if (!torneo) notFound();
  if (torneo.estado !== "publicado") notFound();
  // Torneo con inscripción en plataforma externa: aquí no hay nada que
  // rellenar, se manda directamente a esa web (por si alguien llega a
  // esta ruta directamente en vez de por el botón "Inscribirme").
  if (torneo.inscripcion_url_externa) redirect(torneo.inscripcion_url_externa);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const jugador = user ? await asegurarJugadorParaUsuario(supabase, user) : null;
  const whatsappTelefono = await obtenerWhatsappTelefono();

  let lleno = false;
  if (torneo.cupo_maximo != null) {
    const { data: cupo } = await supabase
      .from("torneos_cupo")
      .select("inscritos")
      .eq("torneo_id", torneo.id)
      .maybeSingle();

    if (jugador) {
      const { data: yaInscrito } = await supabase
        .from("inscripciones")
        .select("id")
        .eq("torneo_id", torneo.id)
        .eq("jugador_id", jugador.id)
        .maybeSingle();
      lleno = !yaInscrito && (cupo?.inscritos ?? 0) >= torneo.cupo_maximo;
    } else {
      lleno = (cupo?.inscritos ?? 0) >= torneo.cupo_maximo;
    }
  }

  if (lleno) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <Link href={`/torneos/${slug}`} className="text-sm text-ajag-gris-500 hover:underline">
          ← Volver al torneo
        </Link>
        <div className="card-ajag mt-6 p-8 text-center">
          <h1 className="font-display text-xl font-semibold text-ajag-verde-900">
            Cupo completo
          </h1>
          <p className="mt-2 text-sm text-ajag-gris-500">
            Ya no quedan plazas disponibles para {torneo.nombre}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Link href={`/torneos/${slug}`} className="text-sm text-ajag-gris-500 hover:underline">
        ← Volver al torneo
      </Link>

      <h1 className="mt-2 font-display text-2xl font-semibold text-ajag-verde-900">
        Inscripción — {torneo.nombre}
      </h1>
      <p className="mt-1 text-sm text-ajag-gris-500">
        {formatearFecha(torneo.fecha)} · {torneo.campo_golf}
      </p>

      {torneo.modo_pago === "club" ? (
        <p className="mt-3 rounded-xl bg-ajag-verde-50 px-4 py-3 text-sm text-ajag-verde-900">
          Este torneo se paga en el club: tu inscripción quedará confirmada
          al momento, sin esperar a que confirmemos ningún pago.
        </p>
      ) : null}

      {!user ? (
        <div className="mt-3 flex flex-col items-start gap-3 rounded-xl bg-ajag-verde-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ajag-verde-900">
            Te estás inscribiendo como invitado. Inicia sesión o crea tu
            cuenta si quieres que tus datos se rellenen solos la próxima vez
            y ver tu historial de torneos.
          </p>
          <Link
            href={`/login?next=/torneos/${slug}/inscripcion`}
            className="shrink-0 rounded-full bg-ajag-verde-700 px-6 py-3 text-base font-semibold text-white transition hover:bg-ajag-verde-600"
          >
            Iniciar sesión
          </Link>
        </div>
      ) : null}

      <div className="mt-6">
        <InscripcionForm
          torneoSlug={slug}
          jugador={jugador}
          precioCents={torneo.precio_cents}
          precioSocioCents={torneo.precio_socio_cents}
          pagaEnClub={torneo.modo_pago === "club"}
          whatsappTelefono={whatsappTelefono}
        />
      </div>
    </div>
  );
}
