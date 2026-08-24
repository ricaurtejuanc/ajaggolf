import type { Metadata } from "next";
import Image from "next/image";
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
    <div className="bg-aftergolf-crema">
      <section className="bg-aftergolf-hero px-4 py-16 text-center">
        <Image
          src="/Logo_AfterGolf.svg"
          alt="AfterGolf"
          width={104}
          height={104}
          priority
          className="mx-auto drop-shadow-sm"
        />
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-aftergolf-oro-700">
          AfterGolf Torneos
        </p>
        <h1 className="mx-auto mt-3 max-w-2xl font-serif text-4xl font-bold text-aftergolf-verde-900 sm:text-5xl">
          El software de torneos para tu club o asociación, sin complicarte ni gastar de más
        </h1>
        <div className="mx-auto mt-5 h-px w-16 bg-aftergolf-oro-500" />
        <p className="mx-auto mt-5 max-w-xl text-aftergolf-verde-800/80">
          Calendario, inscripciones, pagos, salidas, clasificaciones y patrocinadores en una
          sola web con tu propia identidad — pensado para organizadores independientes que
          quieren algo serio sin pagar precios de empresa grande.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={MAILTO}
            className="rounded-full bg-aftergolf-oro-500 px-6 py-3 text-sm font-semibold text-aftergolf-verde-950 transition hover:bg-aftergolf-oro-600"
          >
            Quiero probarlo
          </a>
          {/* No usamos "/" relativo: en torneos.aftergolf.es esa ruta la
              reescribe el proxy de vuelta a esta misma landing (ver
              proxy.ts). Este dominio sirve la home real de AJAG sin ese
              rewrite. */}
          <a
            href="https://ajaggolf-umber.vercel.app/"
            className="rounded-full border border-aftergolf-verde-700/40 px-6 py-3 text-sm font-medium text-aftergolf-verde-800 transition hover:bg-aftergolf-verde-50"
          >
            Ver un ejemplo en vivo (AJAG)
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 text-center">
        <h2 className="font-serif text-2xl font-bold text-aftergolf-verde-900">
          Para asociaciones y clubs que organizan sus propios torneos
        </h2>
        <p className="mt-3 text-aftergolf-verde-800/70">
          Si organizas torneos de golf por tu cuenta — una asociación de jugadores, un grupo de
          amigos con liga propia, un club pequeño — y hoy lo llevas todo por WhatsApp, Excel y
          transferencias, AfterGolf Torneos te da una web real sin necesitar un departamento de
          IT.
        </p>
      </section>

      <section className="bg-aftergolf-verde-50 px-4 py-14">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {caracteristicas.map((c) => (
            <div key={c.titulo} className="card-aftergolf p-5">
              <c.icon size={22} className="text-aftergolf-verde-700" />
              <p className="mt-3 font-serif text-base font-bold text-aftergolf-verde-900">
                {c.titulo}
              </p>
              <p className="mt-1 text-sm text-aftergolf-verde-800/70">{c.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 text-center">
        <h2 className="font-serif text-2xl font-bold text-aftergolf-verde-900">
          Ya lo usa AJAG
        </h2>
        <p className="mt-3 text-aftergolf-verde-800/70">
          La Asociación de Jugadores Amateur de Golf gestiona todo su calendario, inscripciones
          y clasificaciones con AfterGolf Torneos.
        </p>
        <Link
          href="/torneos"
          className="mt-5 inline-block rounded-full bg-aftergolf-verde-700 px-6 py-3 text-sm font-medium text-white transition hover:bg-aftergolf-verde-600"
        >
          Ver el calendario de AJAG →
        </Link>
      </section>

      <section className="px-4 py-16 text-center">
        <h2 className="font-serif text-2xl font-bold text-aftergolf-verde-900">
          Empieza gratis
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-aftergolf-verde-800/70">
          Sin cuota fija para empezar. Escríbenos y ponemos tu torneo en marcha.
        </p>
        <a
          href={MAILTO}
          className="mt-5 inline-block rounded-full bg-aftergolf-oro-500 px-6 py-3 text-sm font-semibold text-aftergolf-verde-950 transition hover:bg-aftergolf-oro-600"
        >
          Escríbenos
        </a>
      </section>
    </div>
  );
}
