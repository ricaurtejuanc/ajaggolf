import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Dominio "paraguas" del SaaS: en la raíz muestra la landing de producto,
// no el sitio de un organizador concreto. Cualquier otra ruta bajo este
// mismo host (/torneos, /admin, etc.) sigue sirviendo la app normal.
const DOMINIOS_LANDING = new Set(["torneos.aftergolf.es", "www.torneos.aftergolf.es"]);

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;
  const debeReescribir = DOMINIOS_LANDING.has(host) && pathname === "/";
  const esLanding = debeReescribir || pathname === "/producto";

  if (esLanding) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-show-landing", "1");

    if (debeReescribir) {
      const url = request.nextUrl.clone();
      url.pathname = "/producto";
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }

    // Visita directa a /producto (en cualquier host): solo hace falta la
    // cabecera para que el layout raíz oculte la cabecera/pie de AJAG.
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
