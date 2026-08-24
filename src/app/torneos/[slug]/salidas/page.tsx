import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { obtenerTorneoPorSlug } from "@/lib/data/torneos";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const torneo = await obtenerTorneoPorSlug(slug);
  return { title: torneo ? `Salidas — ${torneo.nombre}` : "Salidas" };
}

export default async function SalidasPublicasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const torneo = await obtenerTorneoPorSlug(slug);
  if (!torneo) notFound();

  // El PDF oficial del club manda si existe: se embebe fijo, igual que la
  // clasificación, en lugar de mostrar el cuadro generado por la app.
  if (torneo.horarios_pdf_url) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/horarios" className="text-sm text-ajag-gris-500 hover:underline">
          ← Horarios
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ajag-verde-900">
          Horarios
        </h1>
        <div className="mt-6 overflow-hidden rounded-2xl border border-ajag-gris-100">
          <iframe
            src={`${torneo.horarios_pdf_url}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
            className="h-[75vh] w-full pointer-events-none"
            title="Horarios"
          />
        </div>
        <a
          href={torneo.horarios_pdf_url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm font-medium text-ajag-verde-700 hover:underline"
        >
          Abrir en una pestaña nueva ↗
        </a>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: filas } = await supabase
    .from("salidas_publicadas")
    .select("*")
    .eq("torneo_id", torneo.id)
    .order("numero_grupo", { ascending: true });

  if (!filas || filas.length === 0) notFound();

  const modo = filas[0].modo;
  const grupos = new Map<
    string,
    {
      numeroGrupo: number;
      hoyoSalida: number;
      horaSalida: string | null;
      jugadores: { id: string; nombre: string; handicap: number | null }[];
    }
  >();

  for (const fila of filas) {
    if (!grupos.has(fila.grupo_salida_id)) {
      grupos.set(fila.grupo_salida_id, {
        numeroGrupo: fila.numero_grupo,
        hoyoSalida: fila.hoyo_salida,
        horaSalida: fila.hora_salida,
        jugadores: [],
      });
    }
    if (fila.grupo_salida_jugador_id && fila.nombre) {
      grupos.get(fila.grupo_salida_id)!.jugadores.push({
        id: fila.grupo_salida_jugador_id,
        nombre: `${fila.nombre} ${fila.apellidos ?? ""}`.trim(),
        handicap: fila.handicap,
      });
    }
  }

  const gruposOrdenados = Array.from(grupos.values()).sort(
    (a, b) => a.numeroGrupo - b.numeroGrupo,
  );

  const primerGrupo = gruposOrdenados[0];
  const segundoGrupo = gruposOrdenados[1];
  let detalle: string;
  if (modo === "shotgun") {
    detalle = primerGrupo?.horaSalida
      ? `Salida a tiro (shotgun) a partir de las ${primerGrupo.horaSalida.slice(0, 5)}`
      : "Salida a tiro (shotgun)";
  } else {
    const partes = ["Salidas consecutivas"];
    if (primerGrupo?.hoyoSalida) partes.push(`desde el tee #${primerGrupo.hoyoSalida}`);
    if (primerGrupo?.horaSalida) {
      partes.push(`a partir de las ${primerGrupo.horaSalida.slice(0, 5)}`);
    }
    if (primerGrupo?.horaSalida && segundoGrupo?.horaSalida) {
      const [h1, m1] = primerGrupo.horaSalida.split(":").map(Number);
      const [h2, m2] = segundoGrupo.horaSalida.split(":").map(Number);
      const intervalo = h2 * 60 + m2 - (h1 * 60 + m1);
      if (intervalo > 0) partes.push(`con intervalos de ${intervalo}m`);
    }
    detalle = partes.join(" ");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/horarios" className="text-sm text-ajag-gris-500 hover:underline">
        ← Horarios
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ajag-verde-900">
        Cuadro de salidas
      </h1>
      <p className="text-sm text-ajag-gris-500">{detalle}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {gruposOrdenados.map((grupo) => (
          <div key={grupo.numeroGrupo} className="card-ajag p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-ajag-verde-900">
                Grupo {grupo.numeroGrupo}
              </span>
              <span className="flex items-center gap-1 text-xs text-ajag-gris-500">
                {grupo.horaSalida ? (
                  <>
                    <Clock size={13} /> {grupo.horaSalida.slice(0, 5)}
                  </>
                ) : (
                  <>
                    <Flag size={13} /> Hoyo {grupo.hoyoSalida}
                  </>
                )}
              </span>
            </div>
            <ul className="space-y-1">
              {grupo.jugadores.map((j) => (
                <li key={j.id} className="flex items-center justify-between text-sm">
                  <span className="text-ajag-verde-900">{j.nombre}</span>
                  <span className="text-xs text-ajag-gris-500">Hcp {j.handicap ?? "—"}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
