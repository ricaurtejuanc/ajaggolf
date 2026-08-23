import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente con la service role key: se salta RLS por completo. Solo debe
 * usarse en Server Actions/rutas de servidor, nunca en código que llegue
 * al navegador, y solo para lo que realmente lo necesita: la inscripción
 * de invitados, que no tiene sesión (ni siquiera anónima) para pasar los
 * checks de auth.uid() de las políticas normales.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
