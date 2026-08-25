import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Dominio "paraguas" del SaaS: en la raíz muestra la landing de producto,
// no el sitio de un organizador concreto. Cualquier otra ruta bajo este
// mismo host (/torneos, /admin, etc.) sigue sirviendo la app normal.
const DOMINIOS_LANDING = new Set(["torneos.aftergolf.es", "www.torneos.aftergolf.es"]);

// Alias de producción que asigna Vercel automáticamente: no es un dominio
// que quiera enseñarse (SEO duplicado, confunde a quien lo comparta), así
// que se redirige siempre a AJAG en su propio dominio. Solo este alias
// concreto, no todo *.vercel.app: las URLs de preview de cada rama/commit
// también acaban en vercel.app y sí interesa poder visitarlas.
const ALIAS_VERCEL = "ajaggolf-umber.vercel.app";
const DOMINIO_CANONICO = "ajag.torneos.aftergolf.es";

/**
 * Resuelve a qué organizador pertenece esta visita según el dominio
 * (`organizadores.dominio`), con fallback a AJAG (slug "ajag") si no hay
 * ninguno que coincida — dominio de preview de Vercel, localhost, un
 * dominio de club todavía no dado de alta... Se usa fetch directo a la
 * REST API (en vez del cliente de supabase-js) para no depender de
 * cookies/sesión aquí, solo de la clave anónima.
 */
async function resolverOrganizadorId(host: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const hostSinWww = host.replace(/^www\./, "");
    const params = new URLSearchParams({
      select: "id,slug,dominio",
      or: `(dominio.eq.${hostSinWww},slug.eq.ajag)`,
      activo: "eq.true",
    });
    const respuesta = await fetch(`${url}/rest/v1/organizadores?${params}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!respuesta.ok) return null;
    const filas: { id: string; slug: string; dominio: string | null }[] = await respuesta.json();
    const porDominio = filas.find((f) => f.dominio === hostSinWww);
    return (porDominio ?? filas.find((f) => f.slug === "ajag"))?.id ?? null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  if (host === ALIAS_VERCEL) {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    url.host = DOMINIO_CANONICO;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  const { pathname } = request.nextUrl;
  const debeReescribir = DOMINIOS_LANDING.has(host) && pathname === "/";
  const esLanding = debeReescribir || pathname === "/producto";

  const organizadorId = await resolverOrganizadorId(host);

  if (esLanding) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-show-landing", "1");
    if (organizadorId) requestHeaders.set("x-organizador-id", organizadorId);

    if (debeReescribir) {
      const url = request.nextUrl.clone();
      url.pathname = "/producto";
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }

    // Visita directa a /producto (en cualquier host): solo hace falta la
    // cabecera para que el layout raíz oculte la cabecera/pie de AJAG.
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return await updateSession(request, organizadorId ? { "x-organizador-id": organizadorId } : undefined);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
