import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();
  // Reenviada a PostgREST como cabecera de la petición: organizador_id_actual()
  // (en Postgres) la lee para desambiguar cuando la misma persona administra
  // más de un organizador — nunca concede acceso por sí sola, solo elige
  // entre los organizadores de los que ya es admin. Ver migración
  // admin_multi_organizador.
  const organizadorId = (await headers()).get("x-organizador-id");

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Se llama desde un Server Component: el middleware ya refresca
            // la sesión, así que un fallo aquí es seguro de ignorar.
          }
        },
      },
      global: organizadorId ? { headers: { "x-organizador-id": organizadorId } } : undefined,
    },
  );
}
