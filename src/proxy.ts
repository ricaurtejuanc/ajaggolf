import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Dominio "paraguas" del SaaS: en la raíz muestra la landing de producto,
// no el sitio de un organizador concreto. Cualquier otra ruta bajo este
// mismo host (/torneos, /admin, etc.) sigue sirviendo la app normal.
const DOMINIO_PLATAFORMA = "torneos.aftergolf.es";
const DOMINIOS_LANDING = new Set([DOMINIO_PLATAFORMA, `www.${DOMINIO_PLATAFORMA}`]);

// Alias de producción que asigna Vercel automáticamente: no es un dominio
// que quiera enseñarse (SEO duplicado, confunde a quien lo comparta), así
// que se redirige siempre a AJAG en su propio dominio. Solo este alias
// concreto, no todo *.vercel.app: las URLs de preview de cada rama/commit
// también acaban en vercel.app y sí interesa poder visitarlas.
const ALIAS_VERCEL = "ajaggolf-umber.vercel.app";
const DOMINIO_CANONICO = "ajag.torneos.aftergolf.es";

// La resolución de organizador por dominio se repite en TODAS las
// peticiones (el middleware corre en cada navegación) pero el resultado
// casi nunca cambia, así que se cachea en memoria un rato: evita ir a la
// REST API de Supabase en cada visita, que era el mayor cuello de botella
// del tiempo de respuesta inicial. Vive por instancia de la función edge
// (no es un caché compartido entre regiones), pero con eso ya basta para
// eliminar la inmensa mayoría de las idas y vueltas repetidas.
const CACHE_ORGANIZADOR_TTL_MS = 5 * 60_000;
const cacheOrganizador = new Map<string, { id: string | null; expira: number }>();

/**
 * Resuelve a qué organizador pertenece esta visita según el dominio
 * (`organizadores.dominio`), con fallback a AJAG (slug "ajag") si no hay
 * ninguno que coincida — dominio de preview de Vercel, localhost, un
 * dominio de club todavía no dado de alta... Se usa fetch directo a la
 * REST API (en vez del cliente de supabase-js) para no depender de
 * cookies/sesión aquí, solo de la clave anónima.
 */
async function resolverOrganizadorId(host: string): Promise<string | null> {
  const hostSinWww = host.replace(/^www\./, "");

  const cacheado = cacheOrganizador.get(hostSinWww);
  if (cacheado && cacheado.expira > Date.now()) return cacheado.id;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
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
    const id = (porDominio ?? filas.find((f) => f.slug === "ajag"))?.id ?? null;
    cacheOrganizador.set(hostSinWww, { id, expira: Date.now() + CACHE_ORGANIZADOR_TTL_MS });
    return id;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostSinWww = host.replace(/^www\./, "");
  const { pathname } = request.nextUrl;
  const esGod = pathname === "/god" || pathname.startsWith("/god/");

  function redirigirA(hostDestino: string) {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    url.host = hostDestino;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  if (host === ALIAS_VERCEL) {
    // /god no debe ni pasar por AJAG de camino: si no, el alias de Vercel
    // redirigía siempre a ajag.torneos.aftergolf.es (aunque fuera /god), y
    // solo en un segundo salto se corregía al dominio de la plataforma.
    return redirigirA(esGod ? DOMINIO_PLATAFORMA : DOMINIO_CANONICO);
  }

  // El panel "god" (super-admin, cruza organizadores) no es de ningún
  // organizador: vive siempre en el dominio de la plataforma, nunca en el
  // subdominio de un cliente (p.ej. ajag.torneos.aftergolf.es), aunque ese
  // dominio resuelva por fallback a AJAG y por tanto también sirviera la
  // ruta. Solo redirige subdominios *.torneos.aftergolf.es (los de
  // clientes reales) — localhost y las URLs de preview de Vercel siguen
  // sirviendo /god directamente, para poder probarlo antes de desplegar.
  if (esGod && hostSinWww !== DOMINIO_PLATAFORMA && hostSinWww.endsWith(`.${DOMINIO_PLATAFORMA}`)) {
    return redirigirA(DOMINIO_PLATAFORMA);
  }

  const esDominioPlataforma = DOMINIOS_LANDING.has(host);
  const debeReescribir = esDominioPlataforma && pathname === "/";
  // El dominio de la plataforma no es el sitio de ningún organizador,
  // sea cual sea la ruta (landing, /god, un 404, cualquier cosa): nunca
  // lleva la cabecera/pie de AJAG. Antes esto solo se aplicaba a "/",
  // "/producto" y "/god" en concreto, así que cualquier otra ruta en este
  // dominio (un 404 típicamente) seguía cayendo al fallback de AJAG y
  // enseñando su marca — con esto queda cubierto todo el dominio.
  const ocultarChromeAjag = esDominioPlataforma || pathname === "/producto" || esGod;

  const organizadorId = await resolverOrganizadorId(host);

  const extraHeaders: Record<string, string> = {};
  if (organizadorId) extraHeaders["x-organizador-id"] = organizadorId;
  if (ocultarChromeAjag) extraHeaders["x-show-landing"] = "1";

  if (debeReescribir) {
    const url = request.nextUrl.clone();
    url.pathname = "/producto";
    const requestHeaders = new Headers(request.headers);
    for (const [nombre, valor] of Object.entries(extraHeaders)) requestHeaders.set(nombre, valor);
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  return await updateSession(request, Object.keys(extraHeaders).length > 0 ? extraHeaders : undefined);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
