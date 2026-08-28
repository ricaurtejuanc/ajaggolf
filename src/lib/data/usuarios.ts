import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Busca un usuario ya registrado (Supabase Auth) por email. La Admin API no
 * tiene "buscar por email" directo, así que se pagina listUsers — de sobra
 * para el número de cuentas que maneja este SaaS hoy. Compartido entre el
 * alta de administradores en /admin (por el propio equipo de un
 * organizador) y en /god (por un super-admin, para cualquier organizador).
 */
export async function buscarUsuarioPorEmail(email: string): Promise<{ id: string } | null> {
  const admin = createAdminClient();
  const emailNormalizado = email.toLowerCase();

  for (let pagina = 1; pagina <= 20; pagina++) {
    const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 200 });
    if (error || data.users.length === 0) return null;

    const encontrado = data.users.find((u) => u.email?.toLowerCase() === emailNormalizado);
    if (encontrado) return { id: encontrado.id };

    if (data.users.length < 200) return null; // última página, no está
  }
  return null;
}
