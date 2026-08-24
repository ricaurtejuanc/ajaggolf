import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-ajag-gris-100 bg-ajag-verde-50 print:hidden">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <Image src="/Logo_AJAG.svg" alt="AJAG Golf" width={36} height={36} />
          <div>
            <p className="font-display font-semibold text-ajag-verde-900">AJAG Golf</p>
            <p className="text-sm text-ajag-gris-500">
              Asociación de Jugadores Amateur de Golf
            </p>
          </div>
        </div>

        <div className="text-sm">
          <p className="mb-2 font-medium text-ajag-verde-900">Navegación</p>
          <ul className="space-y-1.5 text-ajag-gris-500">
            <li><Link href="/torneos" className="hover:text-ajag-verde-700">Calendario de torneos</Link></li>
            <li><Link href="/clasificaciones" className="hover:text-ajag-verde-700">Clasificaciones</Link></li>
            <li><Link href="/contacto" className="hover:text-ajag-verde-700">Contacto</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <p className="mb-2 font-medium text-ajag-verde-900">Cuenta</p>
          <ul className="space-y-1.5 text-ajag-gris-500">
            <li><Link href="/login" className="hover:text-ajag-verde-700">Iniciar sesión</Link></li>
            <li><Link href="/cuenta" className="hover:text-ajag-verde-700">Mis inscripciones</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ajag-gris-100 px-4 py-4 text-center text-xs text-ajag-gris-500">
        © {new Date().getFullYear()} AJAG Golf. Todos los derechos reservados.
        <br />
        Powered by{" "}
        <a
          href="https://www.torneos.aftergolf.es"
          target="_blank"
          rel="noreferrer"
          className="font-medium hover:text-ajag-verde-700 hover:underline"
        >
          AfterGolf Torneos
        </a>
      </div>
    </footer>
  );
}
