import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest, extraHeaders?: Record<string, string>) {
  // Clona siempre desde el request.headers ACTUAL (no uno capturado antes
  // de que setAll añada/renueve cookies de sesión), para no perder esas
  // cookies al mezclarlas con la cabecera extra (x-organizador-id).
  function construirRequestInit() {
    const headers = new Headers(request.headers);
    for (const [nombre, valor] of Object.entries(extraHeaders ?? {})) headers.set(nombre, valor);
    return { headers };
  }

  let supabaseResponse = NextResponse.next({ request: construirRequestInit() });

  // Sin cookie de sesión de Supabase no hay nada que refrescar: llamar de
  // todos modos a auth.getUser() en cada visita anónima satura la API de
  // Auth del proyecto. El nombre de cookie lo fija @supabase/ssr:
  // "sb-<project-ref>-auth-token" (a veces partido en ".0"/".1" si supera
  // el tamaño de una cookie).
  const tieneCookieSesion = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  if (!tieneCookieSesion) {
    return supabaseResponse;
  }

  // Cada <Link> visible en pantalla dispara una precarga (prefetch) en
  // segundo plano, y esas peticiones pasan por este mismo middleware. Una
  // sola página con varios enlaces (p.ej. el listado de torneos en admin,
  // con 4-5 botones por fila) puede disparar 10-20 prefetches casi
  // simultáneos — y sin este filtro, cada uno llamaba a auth.getUser(),
  // ráfagas confirmadas en los logs de Supabase (10+ peticiones a /user en
  // el mismo milisegundo) que agotaban el pool de conexiones y tumbaban
  // peticiones reales en curso (como guardar una inscripción). Un prefetch
  // no necesita sesión fresca: la navegación real que le siga sí pasará
  // por aquí sin esta cabecera y sí la refrescará.
  if (request.headers.get("next-router-prefetch")) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: construirRequestInit() });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // No quitar: refresca el token de sesión en cada request.
  await supabase.auth.getUser();

  return supabaseResponse;
}
