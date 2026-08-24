import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Trophy, Wallet, Users, Handshake, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "AfterGolf Torneos — software de torneos para clubes y asociaciones",
  description:
    "Calendario, inscripciones, pagos, salidas y clasificaciones para tu asociación o club de golf. Sencillo, rápido de poner en marcha y sin gastar de más.",
};

const caracteristicas = [
  {
    icon: CalendarDays,
    titulo: "Calendario y torneos",
    texto: "Publica tus torneos con póster, precios, cupo y toda la información en minutos.",
  },
  {
    icon: Wallet,
    titulo: "Inscripciones y pagos",
    texto: "Tus jugadores se inscriben y pagan online — Bizum manual o pasarela, tú eliges.",
  },
  {
    icon: Users,
    titulo: "Salidas automáticas",
    texto: "Genera el cuadro de salidas por hándicap o a tiro en segundos, no en una hoja de cálculo.",
  },
  {
    icon: Trophy,
    titulo: "Clasificaciones y ligas",
    texto: "Ranking, pool o la liga que quieras, con tabla de puntos configurable.",
  },
  {
    icon: Handshake,
    titulo: "Patrocinadores",
    texto: "Una sección propia para lucir a las empresas que os ayudan.",
  },
  {
    icon: ShieldCheck,
    titulo: "Panel de administración",
    texto: "Todo lo anterior gestionado desde un panel simple, sin depender de nadie más.",
  },
];

const MAILTO =
  "mailto:info@aftergolf.es?subject=Quiero%20AfterGolf%20Torneos%20para%20mi%20club";

export default function ProductoLandingPage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-ajag-verde-900 to-ajag-verde-700 px-4 py-20 text-center text-white">
        <p className="text-sm font-medium uppercase tracking-wide text-ajag-oro-500">
          AfterGolf Torneos
        </p>
        <h1 className="mx-auto mt-3 max-w-2xl font-display text-4xl font-semibold sm:text-5xl">
          El software de torneos para tu club o asociación, sin complicarte ni gastar de más
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-white/80">
          Calendario, inscripciones, pagos, salidas, clasificaciones y patrocinadores en una
          sola web con tu propia identidad — pensado para organizadores independientes que
          quieren algo serio sin pagar precios de empresa grande.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={MAILTO}
            className="rounded-full bg-ajag-oro-500 px-6 py-3 text-sm font-semibold text-ajag-verde-950 transition hover:bg-ajag-oro-600"
          >
            Quiero probarlo
          </a>
          <Link
            href="/torneos"
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Ver un ejemplo en vivo (AJAG)
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 text-center">
        <h2 className="font-display text-2xl font-semibold text-ajag-verde-900">
          Para asociaciones y clubs que organizan sus propios torneos
        </h2>
        <p className="mt-3 text-ajag-gris-500">
          Si organizas torneos de golf por tu cuenta — una asociación de jugadores, un grupo de
          amigos con liga propia, un club pequeño — y hoy lo llevas todo por WhatsApp, Excel y
          transferencias, AfterGolf Torneos te da una web real sin necesitar un departamento de
          IT.
        </p>
      </section>

      <section className="bg-ajag-verde-50 px-4 py-14">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {caracteristicas.map((c) => (
            <div key={c.titulo} className="card-ajag p-5">
              <c.icon size={22} className="text-ajag-verde-700" />
              <p className="mt-3 font-display text-base font-semibold text-ajag-verde-900">
                {c.titulo}
              </p>
              <p className="mt-1 text-sm text-ajag-gris-500">{c.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 text-center">
        <h2 className="font-display text-2xl font-semibold text-ajag-verde-900">
          Ya lo usa AJAG
        </h2>
        <p className="mt-3 text-ajag-gris-500">
          La Asociación de Jugadores Amateur de Golf gestiona todo su calendario, inscripciones
          y clasificaciones con AfterGolf Torneos.
        </p>
        <Link
          href="/torneos"
          className="mt-5 inline-block rounded-full bg-ajag-verde-700 px-6 py-3 text-sm font-medium text-white transition hover:bg-ajag-verde-600"
        >
          Ver el calendario de AJAG →
        </Link>
      </section>

      <section className="px-4 py-16 text-center">
        <h2 className="font-display text-2xl font-semibold text-ajag-verde-900">
          Empieza gratis
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-ajag-gris-500">
          Sin cuota fija para empezar. Escríbenos y ponemos tu torneo en marcha.
        </p>
        <a
          href={MAILTO}
          className="mt-5 inline-block rounded-full bg-ajag-oro-500 px-6 py-3 text-sm font-semibold text-ajag-verde-950 transition hover:bg-ajag-oro-600"
        >
          Escríbenos
        </a>
      </section>
    </div>
  );
}
