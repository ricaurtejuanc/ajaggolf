import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { obtenerTorneoPorSlug } from "@/lib/data/torneos";
import { asegurarJugadorParaUsuario } from "@/lib/data/jugadores";
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/torneos/${slug}/inscripcion`);

  const jugador = await asegurarJugadorParaUsuario(supabase, user);

  let lleno = false;
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
    lleno = !yaInscrito && (cupo?.inscritos ?? 0) >= torneo.cupo_maximo;
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

      <div className="mt-6">
        <InscripcionForm
          torneoSlug={slug}
          jugador={jugador}
          precioCents={torneo.precio_cents}
          precioSocioCents={torneo.precio_socio_cents}
        />
      </div>
    </div>
  );
}
