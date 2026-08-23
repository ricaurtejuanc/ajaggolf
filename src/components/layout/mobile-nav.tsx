"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function MobileNav({
  navLinks,
  isLoggedIn,
  isAdmin,
  itemsCarrito = 0,
}: {
  navLinks: { href: string; label: string }[];
  isLoggedIn: boolean;
  isAdmin: boolean;
  itemsCarrito?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpen((v) => !v)}
        className="flex size-10 items-center justify-center rounded-full text-ajag-verde-900"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-16 border-b border-ajag-gris-100 bg-white px-4 py-4 shadow-lg">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-ajag-verde-900 hover:bg-ajag-verde-50"
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-ajag-gris-100" />
            {isLoggedIn ? (
              <Link
                href="/carrito"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-ajag-verde-900 hover:bg-ajag-verde-50"
              >
                Carrito{itemsCarrito > 0 ? ` (${itemsCarrito})` : ""}
              </Link>
            ) : null}
            {isAdmin ? (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-ajag-verde-900 hover:bg-ajag-verde-50"
              >
                Panel admin
              </Link>
            ) : null}
            <Link
              href={isLoggedIn ? "/cuenta" : "/login"}
              onClick={() => setOpen(false)}
              className="rounded-lg bg-ajag-verde-700 px-3 py-2.5 text-center text-base font-medium text-white"
            >
              {isLoggedIn ? "Mi cuenta" : "Iniciar sesión"}
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
