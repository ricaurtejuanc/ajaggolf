import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";
import { MobileNav } from "./mobile-nav";

const navLinks = [
  { href: "/torneos", label: "Calendario" },
  { href: "/horarios", label: "Horarios" },
  { href: "/clasificaciones", label: "Clasificaciones" },
  { href: "/patrocinadores", label: "Patrocinadores" },
  { href: "/contacto", label: "Contacto" },
  { href: "https://www.aftergolf.es", label: "Calculador de hándicap", external: true },
];

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getUsuarioAdmin() : null;

  let itemsCarrito = 0;
  if (user) {
    const { data: jugador } = await supabase
      .from("jugadores")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (jugador) {
      const { count } = await supabase
        .from("inscripciones")
        .select("id", { count: "exact", head: true })
        .eq("jugador_id", jugador.id)
        .eq("estado", "carrito");
      itemsCarrito = count ?? 0;
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ajag-gris-100 bg-white/90 backdrop-blur print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/Logo_AJAG.svg" alt="AJAG Golf" width={40} height={40} priority />
          <span className="text-lg font-semibold text-ajag-verde-900">
            AJAG Golf
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-ajag-verde-900/80 transition hover:text-ajag-verde-700"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-ajag-verde-900/80 transition hover:text-ajag-verde-700"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Link
              href="/carrito"
              aria-label="Carrito"
              className="relative flex size-10 items-center justify-center rounded-full text-ajag-verde-900 transition hover:bg-ajag-verde-50"
            >
              <ShoppingCart size={20} />
              {itemsCarrito > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-ajag-rojo-600 text-[10px] font-medium text-white">
                  {itemsCarrito}
                </span>
              ) : null}
            </Link>
          ) : null}
          {admin ? (
            <Link
              href="/admin"
              className="rounded-full bg-ajag-verde-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-ajag-verde-800"
            >
              Panel admin
            </Link>
          ) : null}
          {user ? (
            <Link
              href="/cuenta"
              className="rounded-full border border-ajag-verde-700 px-4 py-2 text-sm font-medium text-ajag-verde-700 transition hover:bg-ajag-verde-50"
            >
              Mi cuenta
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-ajag-verde-700 px-6 py-3 text-base font-semibold text-white transition hover:bg-ajag-verde-600"
            >
              Iniciar sesión
            </Link>
          )}
        </div>

        <MobileNav
          navLinks={navLinks}
          isLoggedIn={!!user}
          isAdmin={!!admin}
          itemsCarrito={itemsCarrito}
        />
      </div>
    </header>
  );
}
