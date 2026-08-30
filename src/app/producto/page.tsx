import type { Metadata } from "next";
import Image from "next/image";
import {
  CalendarDays,
  Trophy,
  Wallet,
  Flag,
  Handshake,
  PiggyBank,
  Settings,
} from "lucide-react";

export const metadata: Metadata = {
  title: "AfterGolf Torneos — software de torneos para clubes y asociaciones",
  description:
    "Calendario, inscripciones, pagos, salidas, clasificaciones, patrocinadores y control económico, todo gestionado desde una única plataforma y con la identidad de tu organización.",
};

const caracteristicas = [
  {
    icon: CalendarDays,
    titulo: "Calendario y torneos",
    texto:
      "Crea y publica tus torneos en minutos. Añade póster, fecha, campo, precios, categorías, plazas disponibles y toda la información que necesitan tus jugadores.",
  },
  {
    icon: Wallet,
    titulo: "Inscripciones y pagos",
    texto:
      "Centraliza las inscripciones de tus jugadores y facilita el pago online — hoy con Bizum, y con más métodos de pago a medida que tu organización los necesite.",
  },
  {
    icon: Flag,
    titulo: "Salidas y horarios",
    texto:
      "Genera las salidas automáticamente por hándicap, a tiro o como prefieras, respetando quién quiere jugar con quién, y tenlas listas en segundos para enviar al campo.",
  },
  {
    icon: Trophy,
    titulo: "Clasificaciones y ligas",
    texto:
      "Gestiona rankings, pools y ligas con sistemas de puntuación configurables. Incorpora directamente el PDF o la foto de resultados del campo, o introdúcelos a mano si no los tienes.",
  },
  {
    icon: Handshake,
    titulo: "Patrocinadores",
    texto:
      "Da visibilidad a las empresas que apoyan tus torneos con un espacio propio para mostrar sus logos, información y presencia durante la competición.",
  },
  {
    icon: PiggyBank,
    titulo: "Economía y rentabilidad",
    texto:
      "Controla ingresos, gastos y beneficio, del club entero y torneo a torneo: lo que entra por inscripciones se calcula solo, y tú añades el pago al campo, los regalos, el catering o los patrocinios para ver el margen real de cada prueba.",
  },
  {
    icon: Settings,
    titulo: "Panel de administración",
    texto:
      "Gestiona torneos, jugadores, inscripciones, salidas, clasificaciones, patrocinadores y contenidos desde un único panel, sin depender de Excel, emails o herramientas dispersas.",
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
          Organiza tus torneos de golf. Todo en un solo lugar.
        </h1>
        <div className="mx-auto mt-5 h-px w-16 bg-aftergolf-oro-500" />
        <p className="mx-auto mt-5 max-w-xl text-aftergolf-verde-800/80">
          Calendario, inscripciones, pagos, salidas, clasificaciones, patrocinadores y control
          económico, todo gestionado desde una única plataforma y con la identidad de tu
          organización.
        </p>
        <p className="mx-auto mt-4 max-w-xl font-serif text-lg font-semibold text-aftergolf-verde-900">
          Tu espacio. Tu marca. Tus torneos.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-aftergolf-verde-800/80">
          Una solución profesional y personalizable para asociaciones, clubes y organizadores
          independientes de golf.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={MAILTO}
            className="rounded-full bg-aftergolf-oro-500 px-6 py-3 text-sm font-semibold text-aftergolf-verde-950 transition hover:bg-aftergolf-oro-600"
          >
            Quiero probarlo
          </a>
          <a
            href="https://ajag.torneos.aftergolf.es/"
            className="rounded-full border border-aftergolf-verde-700/40 px-6 py-3 text-sm font-medium text-aftergolf-verde-800 transition hover:bg-aftergolf-verde-50"
          >
            Ver un ejemplo
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 text-center">
        <h2 className="font-serif text-2xl font-bold text-aftergolf-verde-900">
          Tu web de torneos, a tu manera
        </h2>
        <p className="mt-3 text-aftergolf-verde-800/70">
          Crea un espacio personalizado para tus torneos, con tu imagen, tu calendario y toda
          la información que necesitan tus jugadores.
        </p>
        <p className="mt-3 text-aftergolf-verde-800/70">
          Tus jugadores consultan el torneo, se inscriben y pagan sin salir de tu espacio —
          con tu marca y tu dominio, no el nuestro. Y cuando llega el día de juego, sigues
          trabajando con tu campo como siempre: le envías las salidas ya generadas y, al
          terminar, subes el PDF o la foto de resultados que te entreguen para publicar la
          clasificación.
        </p>
        <p className="mt-4 font-medium text-aftergolf-verde-900">
          No necesitas cambiar cómo te relacionas con el campo. Solo centralizar y
          profesionalizar todo lo demás.
        </p>
      </section>

      <section className="bg-aftergolf-verde-50 px-4 py-14">
        <h2 className="mx-auto max-w-2xl text-center font-serif text-2xl font-bold text-aftergolf-verde-900">
          Todo lo que necesitas para organizar tus torneos
        </h2>
        <div className="mx-auto mt-8 flex max-w-5xl flex-wrap justify-center gap-6">
          {caracteristicas.map((c) => (
            <div
              key={c.titulo}
              className="card-aftergolf w-full p-5 sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
            >
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
          Nuestros clientes
        </h2>
        <div className="mt-8 flex justify-center">
          <Image
            src="/Logo_AJAG.svg"
            alt="AJAG — Asociación de Jugadores Amateur de Golf"
            width={140}
            height={140}
          />
        </div>
        <p className="mt-3 text-sm text-aftergolf-verde-800/60">
          AJAG · Asociación de Jugadores Amateur de Golf
        </p>
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
