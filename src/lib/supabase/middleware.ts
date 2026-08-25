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
